/**
 * Search Routes – Full-text + geo search across lost and found items
 */
import { Router } from 'express';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=wallet&type=lost&category=Bags&page=1
router.get('/', optionalAuth, searchRateLimiter, asyncHandler(async (req, res) => {
  const {
    q, type = 'all',
    category, color, brand,
    startDate, endDate,
    lat, lng, maxDistance,
    page = 1, limit = 12,
    sortBy = 'score',
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const results = { lost: [], found: [], total: 0 };

  const buildQuery = (base = {}) => {
    const query = { ...base, status: 'active' };
    if (category) query.category = category;
    if (color)    query.color    = { $regex: color, $options: 'i' };
    if (brand)    query.brand    = { $regex: brand, $options: 'i' };

    if (lat && lng) {
      const dist = parseFloat(maxDistance) || 50;
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: dist * 1000,
        },
      };
    }
    return query;
  };

  // Regex search for generic case-insensitive partial matching
  const textQuery = q ? {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } }
    ]
  } : {};
  const projection = {}; // Score projection removed because it requires text search
  const sort = { createdAt: -1 }; // Generic fallback sort

  const fetchOptions = {
    projection,
    sort,
    skip,
    limit: parseInt(limit),
    populate: { path: 'reportedBy', select: 'name avatar avatarUrl' },
    lean: true,
  };

  // Fetch based on type
  if (type === 'all' || type === 'lost') {
    const query = { ...buildQuery(), ...textQuery };
    if (startDate || endDate) {
      query.lostDate = {};
      if (startDate) query.lostDate.$gte = new Date(startDate);
      if (endDate)   query.lostDate.$lte = new Date(endDate);
    }
    results.lost = await LostItem.find(query, projection)
      .sort(sort).skip(skip).limit(parseInt(limit))
      .populate('reportedBy', 'name avatar avatarUrl').lean();
  }

  if (type === 'all' || type === 'found') {
    const query = { ...buildQuery(), ...textQuery };
    if (startDate || endDate) {
      query.foundDate = {};
      if (startDate) query.foundDate.$gte = new Date(startDate);
      if (endDate)   query.foundDate.$lte = new Date(endDate);
    }
    results.found = await FoundItem.find(query, projection)
      .sort(sort).skip(skip).limit(parseInt(limit))
      .populate('reportedBy', 'name avatar avatarUrl').lean();
  }

  results.total = results.lost.length + results.found.length;

  // Suggestions: common search terms (simplified)
  const suggestions = [];
  if (q && q.length >= 2) {
    const lostTitles = await LostItem.find(
      { title: { $regex: q, $options: 'i' }, status: 'active' },
      'title'
    ).limit(5).lean();
    suggestions.push(...lostTitles.map(i => i.title));
  }

  res.json(new ApiResponse(200, {
    results,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    query: { q, type, category, color, brand, page, limit },
    pagination: {
      page:   parseInt(page),
      limit:  parseInt(limit),
      total:  results.total,
    },
  }, 'Search results'));
}));

// GET /api/search/suggestions?q=...
router.get('/suggestions', searchRateLimiter, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json(new ApiResponse(200, [], 'No suggestions'));

  const [lost, found] = await Promise.all([
    LostItem.find({ title: { $regex: q, $options: 'i' }, status: 'active' }, 'title category').limit(5).lean(),
    FoundItem.find({ title: { $regex: q, $options: 'i' }, status: 'active' }, 'title category').limit(5).lean(),
  ]);

  const suggestions = [...lost, ...found]
    .map(i => ({ title: i.title, category: i.category }))
    .slice(0, 8);

  res.json(new ApiResponse(200, suggestions, 'Suggestions'));
}));

export default router;
