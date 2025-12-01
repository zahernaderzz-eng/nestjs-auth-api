import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Resource } from '../roles/enums/resource.enum';
import { Action } from '../roles/enums/action.enum';

@Controller('categories')
@UseGuards(AuthenticationGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  //CREATE
  @UseGuards(AuthorizationGuard)
  @Post()
  @Permissions([{ resource: Resource.category, actions: [Action.create] }])
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() userId: number,
  ) {
    const category = await this.categoriesService.create(
      createCategoryDto,
      userId,
    );
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  //  GET ALL
  @Get()
  async findAll() {
    const data = await this.categoriesService.findAll();
    return {
      success: true,
      message: 'Categories fetched successfully',
      data,
    };
  }

  // GET ONE
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.categoriesService.findOne(+id);
    return data;
  }

  //  UPDATE
  @Patch(':id')
  @Permissions([{ resource: Resource.category, actions: [Action.update] }])
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(+id, updateCategoryDto);
    return data;
  }
}
