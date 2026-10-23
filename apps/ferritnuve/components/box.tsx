"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@artek/ui/components/button";
import { cn } from "@/lib/utils";

interface BoxProps {
  backgroundColor?: string;
  backgroundGradient?: string;
  height?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttons?: Array<{
    text: string;
    href?: string;
    variant?:
      | "default"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | "destructive";
    onClick?: () => void;
  }>;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const Box: React.FC<BoxProps> = ({
  backgroundColor,
  backgroundGradient,
  height = "h-[700px]",
  title,
  subtitle,
  description,
  buttons = [],
  imageSrc,
  imageAlt = "",
  imageClassName = "",
  className = "",
  children,
}) => {
  // Determine if dark based on background color
  const isDark = backgroundColor === "bg-black" || backgroundColor?.includes("bg-slate") || backgroundColor?.includes("bg-zinc");
  
  // Apply gradient if provided, otherwise use backgroundColor
  const bgClass = backgroundGradient || backgroundColor || "bg-muted";

  return (
    <motion.div
      className={cn(
        height,
        "w-full grid grid-rows-[auto_1fr] items-center px-4 py-8 md:py-12",
        bgClass,
        className
      )}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* Content Area - Fixed height allocation */}
      <div className="flex flex-col items-center justify-start gap-3 md:gap-4 min-h-[240px] md:min-h-[280px]">
        {title && (
          <motion.h1
            variants={itemVariants}
            className={cn(
              "text-3xl sm:text-4xl md:text-5xl font-semibold text-center",
              isDark ? "text-white" : "text-black"
            )}
          >
            {title}
          </motion.h1>
        )}

        {subtitle && (
          <motion.p
            variants={itemVariants}
            className={cn(
              "text-lg sm:text-xl font-thin text-center max-w-2xl",
              isDark ? "text-white" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </motion.p>
        )}

        {description && (
          <motion.p
            variants={itemVariants}
            className={cn(
              "text-sm sm:text-base font-light text-center max-w-xl",
              isDark ? "text-white" : "text-muted-foreground"
            )}
          >
            {description}
          </motion.p>
        )}

        {buttons.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-2 md:gap-3"
          >
            {buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "default"}
                size="lg"
                onClick={button.onClick}
                asChild={!!button.href}
              >
                {button.href ? (
                  <Link href={button.href}>{button.text}</Link>
                ) : (
                  button.text
                )}
              </Button>
            ))}
          </motion.div>
        )}

        {children}
      </div>

      {/* Image Area - Flexible with consistent constraints */}
      {imageSrc && (
        <div className="flex items-center justify-center w-full">
          <motion.img
            variants={imageVariants}
            src={imageSrc}
            alt={imageAlt}
            className={cn(
              "object-contain w-auto max-h-[280px] md:max-h-[360px] max-w-full",
              isDark &&
                "drop-shadow-[0_0_60px_rgba(255,255,255,0.9)]",
              imageClassName
            )}
          />
        </div>
      )}
    </motion.div>
  );
};
