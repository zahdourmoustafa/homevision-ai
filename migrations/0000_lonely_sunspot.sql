CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"room_type" text NOT NULL,
	"design_type" text NOT NULL,
	"additional_requirements" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"name" varchar NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"image_url" varchar NOT NULL,
	"credits" integer DEFAULT 3,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
