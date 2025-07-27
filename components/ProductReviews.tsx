"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { reviewsApi } from "@/config";

interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  full_name?: string;
  user_avatar?: string;
  avatar?: string;
  rating: number;
  title?: string;
  comment?: string;
  helpful_count: number;
  verified_purchase?: boolean;
  is_approved?: boolean;
  created_at: string;
  images?: string[];
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

export default function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Review form state
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    comment: "",
  });

  useEffect(() => {
    loadReviews();
  }, [productId, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);

      const response = await reviewsApi.getByProduct(productId, {
        page,
        limit: 10,
      });

      if (response.success && response.data) {
        const { reviews: newReviews, summary, pagination } = response.data;

        if (page === 1) {
          setReviews(newReviews || []);

          // Set stats from summary
          if (summary) {
            setStats({
              total_reviews: summary.total_reviews || 0,
              average_rating: parseFloat(summary.average_rating) || 0,
              rating_breakdown: {
                5: summary.rating_5_count || 0,
                4: summary.rating_4_count || 0,
                3: summary.rating_3_count || 0,
                2: summary.rating_2_count || 0,
                1: summary.rating_1_count || 0,
              },
            });
          }
        } else {
          setReviews((prev) => [...prev, ...(newReviews || [])]);
        }

        // Check if there are more pages
        if (pagination) {
          setHasMore(pagination.current_page < pagination.total_pages);
        }
      } else {
        // No fallback data - show empty state
        if (page === 1) {
          setReviews([]);
          setStats(null);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
      // No fallback data on error - show empty state
      if (page === 1) {
        setReviews([]);
        setStats(null);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để viết đánh giá");
      return;
    }

    if (newReview.rating === 0) {
      alert("Vui lòng chọn số sao đánh giá");
      return;
    }

    try {
      setSubmitting(true);

      const response = await reviewsApi.add({
        product_id: productId,
        rating: newReview.rating,
        title: newReview.title || undefined,
        comment: newReview.comment || undefined,
      });

      if (response.success) {
        // Reload reviews to get updated data
        setPage(1);
        await loadReviews();

        // Reset form
        setNewReview({ rating: 0, title: "", comment: "" });
        setShowReviewForm(false);

        alert("Đánh giá của bạn đã được gửi thành công!");
      } else {
        throw new Error(response.message || "Failed to submit review");
      }
    } catch (error: any) {
      console.error("Failed to submit review:", error);

      // Handle specific error messages
      let errorMessage = "Có lỗi xảy ra khi gửi đánh giá";

      // Handle different types of errors
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && typeof error.message === "string") {
        if (error.message.includes("already reviewed")) {
          errorMessage = "Bạn đã đánh giá sản phẩm này rồi";
        } else if (error.message.includes("Product not found")) {
          errorMessage = "Không tìm thấy sản phẩm";
        } else if (error.message.includes("Authentication")) {
          errorMessage = "Bạn cần đăng nhập để đánh giá";
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        // Log the full error object for debugging
        console.error("Full error object:", JSON.stringify(error, null, 2));
        errorMessage = "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.";
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (
    rating: number,
    interactive = false,
    size = "w-5 h-5",
  ) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
            onClick={
              interactive
                ? () => setNewReview((prev) => ({ ...prev, rating: star }))
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    if (!stats) return 0;
    return stats.total_reviews > 0
      ? (stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown] /
          stats.total_reviews) *
          100
      : 0;
  };

  return (
    <div className="space-y-6">

      {/* Review Summary */}
      {stats && (
        <Card>
             
          <CardHeader>
            <CardTitle>Đánh giá sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-2">
                  {stats.average_rating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.average_rating))}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.total_reviews} đánh giá
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm w-6">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <Progress
                      value={getRatingPercentage(rating)}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {
                        stats.rating_breakdown[
                          rating as keyof typeof stats.rating_breakdown
                        ]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review Button */}
            <div className="mt-6 text-center">
              {isAuthenticated ? (
                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Viết đánh giá
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Đánh giá sản phẩm</DialogTitle>
                      <DialogDescription>
                        Chia sẻ trải nghiệm của bạn về {productName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Rating Stars */}
                      <div>
                        <Label>Đánh giá của bạn *</Label>
                        <div className="mt-2">
                          {renderStars(newReview.rating, true, "w-8 h-8")}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <Label htmlFor="title">Tiêu đề đánh giá</Label>
                        <Input
                          id="title"
                          value={newReview.title}
                          onChange={(e) =>
                            setNewReview((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Tóm tắt đánh giá của bạn..."
                          maxLength={100}
                        />
                      </div>

                      {/* Comment */}
                      <div>
                        <Label htmlFor="comment">Nội dung đánh giá</Label>
                        <Textarea
                          id="comment"
                          value={newReview.comment}
                          onChange={(e) =>
                            setNewReview((prev) => ({
                              ...prev,
                              comment: e.target.value,
                            }))
                          }
                          placeholder="Chia sẻ chi tiết về trải nghiệm sử dụng sản phẩm..."
                          rows={4}
                          maxLength={1000}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          {newReview.comment.length}/1000 ký tự
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={submitReview}
                        disabled={submitting || newReview.rating === 0}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          "Gửi đánh giá"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    Đăng nhập để viết đánh giá
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/login">Đăng nhập</a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Đánh giá từ khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && reviews.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Chưa có đánh giá nào
              </h3>
              <p className="text-gray-600">
                Hãy là người đầu tiên đánh giá sản phẩm này!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  <div className="flex space-x-3">
                    {/* User Avatar */}
                    <Avatar>
                      {review.user_avatar && (
                        <AvatarImage
                          src={review.user_avatar}
                          alt={review.user_name || review.full_name || "User"}
                        />
                      )}
                      <AvatarFallback>
                        {review.user_name
                          ? review.user_name.substring(0, 2).toUpperCase()
                          : "UN"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Review Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">
                          {review.user_name || review.full_name || "Khách hàng"}
                        </span>
                        {review.verified_purchase && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đã mua hàng
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        {renderStars(review.rating, false, "w-4 h-4")}
                        <span className="text-sm text-gray-600">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-2">
                          {review.title}
                        </h4>
                      )}

                      {review.comment && (
                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                          {review.comment}
                        </p>
                      )}

                      {/* Review Actions */}
                      <div className="flex items-center space-x-4 text-sm">
                        <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                          <ThumbsUp className="w-4 h-4" />
                          <span>Hữu ích ({review.helpful_count})</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                          <ThumbsDown className="w-4 h-4" />
                          <span>Không hữu ích</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      "Xem thêm đánh giá"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
