import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { User } from '../user/entities/user.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
    //private userService: UserService,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  // ---------------------------------------------------------
  async create(userId: number, dto: CreateReviewDto) {
    const { productId, rating, comment } = dto;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check duplicate review
    const already = await this.reviewRepo.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ['user', 'product'],
    });

    if (already) {
      throw new ConflictException('You already reviewed this product');
    }

    const review = this.reviewRepo.create({
      user,
      product,
      rating,
      comment,
    });

    const saved = await this.reviewRepo.save(review);

    await this.recalculateProductRating(productId);

    return saved;
  }

  async findByProduct(productId: number, page = 1) {
    return this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.productId = :productId', { productId })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * 10)
      .take(10)
      .select([
        'review.id',
        'review.rating',
        'review.comment',
        'review.createdAt',
        'review.updatedAt',

        'user.id',
        'user.name',
        'user.email',
      ])
      .getMany();
  }

  async update(userId: number, reviewId: number, dto: UpdateReviewDto) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product'],
    });

    if (!review) throw new NotFoundException('Review not found');

    if (review.user.id !== userId) {
      throw new ForbiddenException('You cannot edit this review');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;

    const updated = await this.reviewRepo.save(review);

    await this.recalculateProductRating(review.product.id);

    return updated;
  }

  async remove(userId: number, reviewId: number) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product'],
    });

    if (!review) throw new NotFoundException('Review not found');

    if (review.user.id !== userId) {
      throw new ForbiddenException('You cannot delete this review');
    }

    const productId = review.product.id;

    await this.reviewRepo.delete(reviewId);

    await this.recalculateProductRating(productId);
  }

  private async recalculateProductRating(productId: number) {
    const stats = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.productId = :productId', { productId })
      .getRawOne();

    const avg = stats.avg ? Number(parseFloat(stats.avg).toFixed(1)) : 0;
    const count = Number(stats.count) || 0;

    await this.productRepo.update(
      { id: productId },
      {
        averageRating: avg,
        reviewCount: count,
      },
    );
  }
}
