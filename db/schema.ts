import { integer, pgTable, serial, varchar, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  name: varchar('name').notNull(),
  id: serial('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  createdat: timestamp('created_at').defaultNow(),
  imageurl: varchar('image_url').notNull(),
  credits: integer('credits').default(3),
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  image_url: text('image_url').notNull(),
  transformed_image_url: text('transformed_image_url').notNull(),
  room_type: text('room_type').notNull(),
  design_type: text('design_type').notNull(),
  additional_requirements: text('additional_requirements'),
  user_email: varchar('user_email').notNull(),
  createdat: timestamp('created_at').defaultNow(),
});

