import axios from 'axios';
import FormData from 'form-data';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const autoFillDetails = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Image file is required for auto-fill');
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Create form data to send to Python AI Service
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });

    const response = await axios.post(`${aiServiceUrl}/analyze`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    if (response.data.error) {
      throw new ApiError(500, response.data.error);
    }

    res.status(200).json(
      new ApiResponse(200, response.data, 'Image analyzed successfully')
    );
  } catch (error) {
    if (error.response) {
      next(new ApiError(error.response.status, error.response.data?.detail || 'AI Service Error'));
    } else {
      next(error);
    }
  }
};
