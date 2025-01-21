CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"room_type" text NOT NULL,
	"design_type" text NOT NULL,
	"additional_requirements" text,
	"created_at" timestamp DEFAULT now()
);
