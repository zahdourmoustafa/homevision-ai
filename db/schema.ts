import { integer, pgTable, serial, varchar, uuid, text, timestamp } from "drizzle-orm/pg-core";


export const users = pgTable('users', {
  name: varchar('name').notNull(),
  id: serial('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  createdat: timestamp('created_at').defaultNow(),
  imageurl: varchar('image_url').notNull(),
  credits:integer('credits').default(3),
});
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  imageurl: text('image_url').notNull(),
  roomtype: text('room_type').notNull(),
  designtype: text('design_type').notNull(),
  additionalreq: text('additional_requirements'),
  userEmail: varchar('user_email').notNull(),
  createdat: timestamp('created_at').defaultNow(),
});

