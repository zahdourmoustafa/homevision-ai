import { integer, pgTable, serial, varchar, uuid, text, timestamp } from "drizzle-orm/pg-core";



export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  imageurl: text('image_url').notNull(),
  roomtype: text('room_type').notNull(),
  designtype: text('design_type').notNull(),
  additionalreq: text('additional_requirements'),
  createdat: timestamp('created_at').defaultNow(),
});

