"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { productsApi, formatPrice } from "../config";

interface Review {
  id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment?: string;
  full_name: string;
  avatar?: string;
  created_at: string;
  helpful_count: number;
}

interface RatingSummary {
  total_reviews: number;
  average_rating: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
}

interface ProductRatingProps {
  productId: number;
  productName: string;
}

export function ProductRating({ productId, productName }: ProductRatingProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const response = await productsApi.getReviews(productId, {
        page: 1,
        limit: 10,
      });

      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setSummary(response.data.summary || null);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const response = await productsApi.addReview(productId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      if (response.success) {
        // Reset form
        setRating(0);
        setTitle("");
        setComment("");
        setIsDialogOpen(false);

        // Reload reviews
        await loadReviews();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRate?: (rating: number) => void,
    onHover?: (rating: number) => void,
  ) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      const isFilled =
        starValue <= (interactive ? hoverRating || rating : rating);

      return (
        <Star
          key={index}
          className={`h-5 w-5 ${
            isFilled ? "text-yellow-500 fill-current" : "text-gray-300"
          } ${interactive ? "cursor-pointer hover:text-yellow-500" : ""}`}
          onClick={interactive ? () => onRate?.(starValue) : undefined}
          onMouseEnter={interactive ? () => onHover?.(starValue) : undefined}
          onMouseLeave={interactive ? () => onHover?.(0) : undefined}
        />
      );
    });
  };

  const getRatingDistribution = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            Đánh giá sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary && summary.total_reviews > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {summary.average_rating?.toFixed(1) || "0.0"}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(summary.average_rating || 0))}
                </div>
                <div className="text-sm text-gray-600">
                  {summary.total_reviews} đánh giá
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary[
                    `rating_${star}_count` as keyof RatingSummary
                  ] as number;
                  const percentage = getRatingDistribution(
                    count,
                    summary.total_reviews,
                  );

                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{star}</span>
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-gray-600">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Chưa có đánh giá nào cho sản phẩm này
              </p>
            </div>
          )}

          {/* Add Review Button */}
          {isAuthenticated ? (
            <div className="mt-6 text-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Viết đánh giá
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Đánh giá sản phẩm</DialogTitle>
                    <DialogDescription>
                      Chia sẻ trải nghiệm của bạn về {productName}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Rating Input */}
                    <div>
                      <Label htmlFor="rating">Đánh giá *</Label>
                      <div className="flex gap-1 mt-2">
                        {renderStars(rating, true, setRating, setHoverRating)}
                      </div>
                    </div>

                    {/* Title Input */}
                    <div>
                      <Label htmlFor="title">Tiêu đề</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tóm tắt đánh giá của bạn"
                        maxLength={255}
                      />
                    </div>

                    {/* Comment Input */}
                    <div>
                      <Label htmlFor="comment">Nội dung đánh giá</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
                        rows={4}
                        maxLength={1000}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={!rating || submitting}
                    >
                      {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-2">Đăng nhập để viết đánh giá</p>
              <Button variant="outline" asChild>
                <a href="/login">Đăng nhập</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Đánh giá từ khách hàng</h3>

          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {review.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {review.full_name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {review.title && (
                      <h5 className="font-medium text-gray-900 mb-2">
                        {review.title}
                      </h5>
                    )}
                    {review.comment && (
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-sm">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="h-4 w-4" />
                        Hữu ích ({review.helpful_count || 0})
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {reviews.length >= 10 && (
            <div className="text-center">
              <Button variant="outline">Xem thêm đánh giá</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
