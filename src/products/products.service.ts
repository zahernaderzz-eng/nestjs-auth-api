import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CategoriesService } from '../categories/categories.service';
import { CloudinaryService } from '../cloudianry/cloudinary.service';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImageRepo: Repository<ProductImage>,

    private categoriesSrvice: CategoriesService,
    private cloudinaryService: CloudinaryService,
  ) {}
  async create(createProductDto: CreateProductDto, userId: number) {
    const { categoryId, ...data } = createProductDto;

    const category = await this.categoriesSrvice.findOne(categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = this.productRepo.create({
      ...data, // title, description, price, stock
      category: category,
      addedBy: { id: userId },
    });

    const savedProduct = await this.productRepo.save(product);

    return savedProduct;
  }

  async findAll() {
    const products = await this.productRepo.find({
      relations: ['images', 'category', 'addedBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      count: products.length,
      data: products,
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'category', 'addedBy'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      data: product,
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepo.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { categoryId, ...data } = updateProductDto;

    if (categoryId) {
      const category = await this.categoriesSrvice.findOne(categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
    }

    Object.assign(product, data);

    const updated = await this.productRepo.save(product);

    return {
      success: true,
      message: 'Product updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepo.remove(product);

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async addImage(productId: number, file: Express.Multer.File) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const uploadResult = await this.cloudinaryService.uploadFile(file);

    const publicId = (uploadResult as any).public_id;
    const secureUrl = (uploadResult as any).secure_url;

    if (!publicId || !secureUrl) {
      throw new BadRequestException('Invalid Cloudinary response');
    }

    const newImage = this.productImageRepo.create({
      publicId,
      secureUrl,
      product,
    });

    await this.productImageRepo.save(newImage);

    return {
      success: true,
      message: 'Image uploaded successfully',
      image: newImage,
    };
  }
}
