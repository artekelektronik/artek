"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface BoxProps {
  backgroundColor?: string;
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
  backgroundColor = "bg-white",
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
  const isDark = backgroundColor === "bg-black";

  return (
    <motion.div
      className={cn(
        height,
        "w-full flex flex-col items-center justify-center gap-3 md:gap-4 px-4 py-8 md:py-12",
        backgroundColor,
        className
      )}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {title && (
        <motion.h1
          variants={itemVariants}
          className={cn(
            "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-center",
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
            "text-lg sm:text-xl md:text-2xl font-thin text-center max-w-2xl",
            isDark ? "text-white" : "text-gray-600"
          )}
        >
          {subtitle}
        </motion.p>
      )}

      {description && (
        <motion.p
          variants={itemVariants}
          className={cn(
            "text-sm sm:text-base md:text-lg font-light text-center max-w-xl",
            isDark ? "text-white" : "text-gray-600"
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
          {buttons.map((button, index) => {
            const isOutline = button.variant === "outline" || index === 1;
            const blueClasses = isOutline
              ? "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
              : "bg-blue-600 hover:bg-blue-700 text-white";

            const buttonElement = (
              <Button
                key={index}
                className={cn("rounded-full text-sm md:text-base", blueClasses)}
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
            );

            return buttonElement;
          })}
        </motion.div>
      )}

      {children}

      {imageSrc && (
        <motion.img
          variants={imageVariants}
          src={imageSrc}
          alt={imageAlt}
          className={cn(
            "object-contain max-h-[35%] md:max-h-[40%] w-auto",
            isDark &&
              "drop-shadow-[0_0_60px_rgba(255,255,255,0.9)] drop-shadow-[0_0_120px_rgba(255,255,255,0.9)]",
            imageClassName
          )}
        />
      )}
    </motion.div>
  );
};
