import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { Order } from '../../orders/entities/order.entity';
import { FcmToken } from '../../fcm-token/entities/fcm-token.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Follower } from '../../followers/entities/follower.entity';
import { Exclude } from 'class-transformer';
import { AccountStatus } from '../enums/account.status.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.UNVERIFIED,
  })
  accountStatus: AccountStatus;

  @Column({ nullable: true })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => Product, (product) => product.addedBy)
  products: Product[];

  @OneToMany(() => Category, (category) => category.addedBy)
  categories: Category[];

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
  @OneToMany(() => FcmToken, (token) => token.user)
  fcmTokens: FcmToken[];

  @OneToMany(() => Review, (r) => r.user)
  reviews: Review[];

  @OneToMany(() => Follower, (f) => f.user)
  followers: Follower[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  address: string;
}
