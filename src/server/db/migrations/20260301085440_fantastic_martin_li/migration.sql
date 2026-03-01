CREATE TABLE "config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "config_unique" ON "config" ("key");--> statement-breakpoint
CREATE INDEX "config_key_index" ON "config" ("key");--> statement-breakpoint
CREATE INDEX "config_value_index" ON "config" ("value");