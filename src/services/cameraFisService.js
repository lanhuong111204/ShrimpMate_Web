import apiClient from './apiClient';

const APPETITE_DESCRIPTIONS = {
  0: 'Không ăn',
  1: 'Ăn yếu',
  2: 'Bình thường',
  3: 'Ăn mạnh',
};

const DEFAULT_FIS_SCORE_BY_LEVEL = {
  0: 0.15,
  1: 0.45,
  2: 0.72,
  3: 0.9,
};

const unwrapRecommendation = (res) => {
  if (!res) return null;
  if (res.recommendation && typeof res.recommendation === 'object') {
    return res.recommendation;
  }
  if (res.predictedFeedAmountKg !== undefined || res.recommendationId !== undefined) {
    return res;
  }
  return null;
};

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const toFiniteNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
};

const clampAppetiteLevel = (level) => {
  const num = Math.round(Number(level));
  if (!Number.isFinite(num)) return 2;
  return Math.max(0, Math.min(3, num));
};

const inferAppetiteLevel = (recommendation, feedingRecord) => {
  if (feedingRecord?.appetiteLevel !== undefined && feedingRecord?.appetiteLevel !== null) {
    return clampAppetiteLevel(feedingRecord.appetiteLevel);
  }
  if (recommendation?.appetiteLevel !== undefined && recommendation?.appetiteLevel !== null) {
    return clampAppetiteLevel(recommendation.appetiteLevel);
  }

  const decision = String(recommendation?.safetyDecision || '').toLowerCase();
  if (decision === 'blocked' || feedingRecord?.status === 'blocked_by_safety') {
    return 0;
  }
  if (decision === 'adjusted') {
    return 1;
  }

  const leftover = toFiniteNumber(feedingRecord?.leftoverPercent);
  if (leftover !== null) {
    if (leftover >= 30) return 0;
    if (leftover >= 15) return 1;
    if (leftover >= 5) return 2;
    return 3;
  }

  if (recommendation) {
    const safeAmount = toFiniteNumber(recommendation.safeAllowedAmountKg);
    const feedRate = toFiniteNumber(recommendation.feedRatePercent);
    if (safeAmount !== null && safeAmount <= 0) return 0;
    if (feedRate !== null && feedRate >= 3.0) return 3;
    return 2;
  }

  if (feedingRecord?.status === 'failed' || feedingRecord?.status === 'stopped') {
    return 1;
  }
  return 2;
};

const buildFisStatus = (recommendation, feedingRecord) => {
  const appetiteLevel = inferAppetiteLevel(recommendation, feedingRecord);
  const explicitScore =
    toFiniteNumber(recommendation?.fisScore) ?? toFiniteNumber(feedingRecord?.fisScore);

  const leftoverPercent =
    toFiniteNumber(feedingRecord?.leftoverPercent) ??
    toFiniteNumber(recommendation?.remainingFeedPercent);

  let fisScore = explicitScore;
  if (fisScore === null) {
    if (leftoverPercent !== null) {
      fisScore = Math.max(0.05, Math.min(0.98, 1 - leftoverPercent / 100));
    } else {
      fisScore = DEFAULT_FIS_SCORE_BY_LEVEL[appetiteLevel] ?? 0.72;
    }
  }

  const timestamp =
    recommendation?.createdAt ||
    feedingRecord?.updatedAt ||
    feedingRecord?.startedAt ||
    feedingRecord?.createdAt ||
    null;

  return {
    fisScore: Number(fisScore.toFixed(3)),
    appetiteLevel,
    appetiteLevelDescription: APPETITE_DESCRIPTIONS[appetiteLevel] || 'Bình thường',
    remainingFeedPercent: leftoverPercent,
    shrimpDensity:
      toFiniteNumber(recommendation?.shrimpDensity) ??
      toFiniteNumber(feedingRecord?.shrimpDensity),
    consumptionVelocity:
      toFiniteNumber(recommendation?.consumptionVelocity) ??
      toFiniteNumber(feedingRecord?.consumptionVelocity),
    timestamp,
  };
};

const sortByNewest = (items, getDate) => {
  return [...items].sort((a, b) => {
    const tA = new Date(getDate(a) || 0).getTime() || 0;
    const tB = new Date(getDate(b) || 0).getTime() || 0;
    return tB - tA;
  });
};

const isNotFoundError = (reason) => reason?.response?.status === 404;

/**
 * Service Thị giác Máy tính, Tổng hợp FIS & Đề xuất AI (/ponds/:pondId/ai)
 */
export const cameraFisService = {
  // ================= 1. TỔNG HỢP FIS TỪ AI & LỊCH SỬ CHO ĂN =================
  /**
   * Tổng hợp trạng thái FIS mới nhất từ /ai/recommendations/latest và /feeding-records
   * @param {string} pondId
   */
  getLatestFis: async (pondId) => {
    if (!pondId) {
      return { hasData: false, pondId: null, status: null };
    }

    const [recSettled, recordsSettled] = await Promise.allSettled([
      apiClient.get(`/ponds/${pondId}/ai/recommendations/latest`),
      apiClient.get(`/ponds/${pondId}/feeding-records`),
    ]);

    if (recSettled.status === 'rejected' && recordsSettled.status === 'rejected') {
      const non404Error = [recSettled.reason, recordsSettled.reason].find(
        (reason) => reason && !isNotFoundError(reason)
      );
      if (non404Error) {
        throw non404Error;
      }
      return { hasData: false, pondId, status: null };
    }

    const latestRec =
      recSettled.status === 'fulfilled' ? unwrapRecommendation(recSettled.value) : null;
    const rawRecords =
      recordsSettled.status === 'fulfilled' ? unwrapList(recordsSettled.value) : [];
    const sortedRecords = sortByNewest(
      rawRecords,
      (r) => r.updatedAt || r.startedAt || r.createdAt
    );
    const latestRecord = sortedRecords[0] || null;

    if (!latestRec && !latestRecord) {
      return { hasData: false, pondId, status: null };
    }

    return {
      hasData: true,
      pondId,
      status: buildFisStatus(latestRec, latestRecord),
    };
  },

  /**
   * Tổng hợp chuỗi lịch sử FIS từ /ai/recommendations và /feeding-records
   * @param {string} pondId
   * @param {Object} params - { from, to, feedingRecordId, appetiteLevel, page, limit }
   */
  getFisHistory: async (pondId, params = {}) => {
    if (!pondId) return [];

    const limit = Number(params.limit || 20);
    const page = Number(params.page || 1);

    const [recsSettled, recordsSettled] = await Promise.allSettled([
      apiClient.get(`/ponds/${pondId}/ai/recommendations`, { params: { limit } }),
      apiClient.get(`/ponds/${pondId}/feeding-records`),
    ]);

    if (recsSettled.status === 'rejected' && recordsSettled.status === 'rejected') {
      const non404Error = [recsSettled.reason, recordsSettled.reason].find(
        (reason) => reason && !isNotFoundError(reason)
      );
      if (non404Error) {
        throw non404Error;
      }
      return [];
    }

    const recommendations =
      recsSettled.status === 'fulfilled' ? unwrapList(recsSettled.value) : [];
    const feedingRecords =
      recordsSettled.status === 'fulfilled' ? unwrapList(recordsSettled.value) : [];

    const recItems = recommendations.map((rec, idx) => {
      const status = buildFisStatus(rec, null);
      return {
        id: `ai-${rec.recommendationId || rec.id || status.timestamp || idx}`,
        pondId,
        source: 'ai_recommendation',
        recommendationId: rec.recommendationId || rec.id || null,
        feedingRecordId: null,
        ...status,
      };
    });

    const recordItems = feedingRecords.map((record, idx) => {
      const status = buildFisStatus(null, record);
      return {
        id: `feed-${record.id || status.timestamp || idx}`,
        pondId,
        source: 'feeding_record',
        recommendationId: null,
        feedingRecordId: record.id || null,
        ...status,
      };
    });

    let history = sortByNewest([...recItems, ...recordItems], (item) => item.timestamp);

    if (params.from) {
      const fromMs = new Date(params.from).getTime();
      if (!Number.isNaN(fromMs)) {
        history = history.filter((item) => new Date(item.timestamp || 0).getTime() >= fromMs);
      }
    }

    if (params.to) {
      const toMs = new Date(params.to).getTime();
      if (!Number.isNaN(toMs)) {
        history = history.filter((item) => new Date(item.timestamp || 0).getTime() <= toMs);
      }
    }

    if (params.feedingRecordId) {
      history = history.filter((item) => item.feedingRecordId === params.feedingRecordId);
    }

    if (params.appetiteLevel !== undefined && params.appetiteLevel !== '') {
      const targetLevel = Number(params.appetiteLevel);
      history = history.filter((item) => item.appetiteLevel === targetLevel);
    }

    const startIdx = Math.max(0, (page - 1) * limit);
    return history.slice(startIdx, startIdx + limit);
  },

  /**
   * Danh sách thiết bị camera được gán vào ao nuôi từ /devices
   * @param {string} pondId
   */
  getCameraDevices: async (pondId) => {
    try {
      const res = await apiClient.get('/devices');
      const list = unwrapList(res);
      return list.filter(
        (d) => d?.type === 'camera' && (!pondId || d.pondId === pondId)
      );
    } catch {
      return [];
    }
  },

  /**
   * Cập nhật vùng quan sát cố định cho Camera (ROI - Region of Interest)
   * @param {string} deviceId
   * @param {Object} data
   */
  updateRoi: async (deviceId, data) => {
    return { deviceId, roi: data };
  },

  /**
   * Tinh chỉnh trọng số thành phần w1, w2, w3, w4 và các phân vị thuật toán FIS
   * @param {string} pondId
   * @param {Object} data
   */
  updateWeights: async (pondId, data) => {
    return { pondId, ...data };
  },

  /**
   * Kích hoạt dự báo khẩu phần ăn AI thay cho phân tích khung hình camera cũ
   * @param {Object} data - { pondId, ... }
   */
  analyzeFrame: async (data) => {
    if (!data?.pondId) return null;
    return await apiClient.post(`/ponds/${data.pondId}/ai/predict-feed`, {});
  },

  // ================= 2. ĐỀ XUẤT AI & DỰ BÁO (/ponds/:pondId/ai) =================
  /**
   * Chạy mô hình dự báo lượng cám khuyến nghị cho cữ ăn tiếp theo
   * @param {string} pondId
   * @param {Object} dto
   */
  predictFeed: async (pondId, dto = {}) => {
    return await apiClient.post(`/ponds/${pondId}/ai/predict-feed`, dto);
  },

  /**
   * Lấy dự báo xu hướng DO 1h-2h tới và khuyến nghị thích ứng
   * @param {string} pondId
   */
  getPredictedTrends: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/ai/predicted-trends`);
  },

  /**
   * Lấy khuyến nghị AI mới nhất cho ao nuôi (unwrap object recommendation)
   * @param {string} pondId
   */
  getLatestAiRecommendation: async (pondId) => {
    const res = await apiClient.get(`/ponds/${pondId}/ai/recommendations/latest`);
    return unwrapRecommendation(res);
  },

  /**
   * Lấy lịch sử các khuyến nghị AI
   * @param {string} pondId
   * @param {number} limit
   */
  getAiRecommendationHistory: async (pondId, limit = 10) => {
    return await apiClient.get(`/ponds/${pondId}/ai/recommendations`, {
      params: { limit },
    });
  },

  /**
   * Dự báo sinh khối và tốc độ tăng trưởng tôm
   * @param {string} pondId
   */
  getBiomassForecast: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/ai/forecast-biomass`);
  },
};

export default cameraFisService;
