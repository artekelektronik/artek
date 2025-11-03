import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface BoxProps {
  /** Background color class (e.g., 'bg-black', 'bg-white') */
  backgroundColor?: string;
  /** Height class (e.g., 'h-[700px]', 'h-screen') */
  height?: string;
  /** Main heading text */
  title?: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** Third text field for additional description */
  description?: string;
  /** Title styling classes */
  titleClassName?: string;
  /** Subtitle styling classes */
  subtitleClassName?: string;
  /** Description styling classes */
  descriptionClassName?: string;
  /** Array of button configurations */
  buttons?: Array<{
    text: string;
    variant?:
      | "default"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | "destructive";
    onClick?: () => void;
    href?: string;
  }>;
  /** Image source URL */
  imageSrc?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Custom image styling classes */
  imageClassName?: string;
  /** Custom container styling classes */
  className?: string;
  /** Custom content area styling classes */
  contentClassName?: string;
  /** Additional children elements */
  children?: React.ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  backgroundColor = "bg-white",
  height = "h-[700px]",
  title,
  subtitle,
  description,
  titleClassName = "text-6xl font-semibold",
  subtitleClassName = "text-2xl font-thin",
  descriptionClassName = "text-lg font-light",
  buttons = [],
  imageSrc,
  imageAlt = "",
  imageClassName = "",
  className = "",
  contentClassName = "flex flex-col items-center justify-center space-y-6 h-full relative",
  children,
}) => {
  return (
    <div
      className={cn(
        height,
        "w-full relative overflow-hidden",
        backgroundColor,
        className
      )}
    >
      <div className={cn(contentClassName)}>
        {title && (
          <h1
            className={cn(
              titleClassName,
              backgroundColor === "bg-black" ? "text-white" : "text-black"
            )}
          >
            {title}
          </h1>
        )}

        {subtitle && (
          <p
            className={cn(
              subtitleClassName,
              backgroundColor === "bg-black" ? "text-white" : "text-gray-600"
            )}
          >
            {subtitle}
          </p>
        )}

        {description && (
          <p
            className={cn(
              descriptionClassName,
              backgroundColor === "bg-black" ? "text-white" : "text-gray-600"
            )}
          >
            {description}
          </p>
        )}

        {buttons.length > 0 && (
          <div className="space-x-3">
            {buttons.map((button, index) => {
              const isOutline = button.variant === "outline" || index === 1;
              const blueClasses = isOutline 
                ? "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
                : "bg-blue-600 hover:bg-blue-700 text-white";
              
              return (
                <Button
                  key={index}
                  className={`rounded-full ${blueClasses}`}
                  variant={button.variant || "default"}
                  size="lg"
                  onClick={button.onClick}
                  asChild={!!button.href}
                >
                  {button.href ? (
                    <a href={button.href}>{button.text}</a>
                  ) : (
                    button.text
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {children}
      </div>

      {imageSrc && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-full flex justify-center max-h-2/3">
          <img
            src={imageSrc}
            alt={imageAlt}
            className={cn(
              "object-contain max-w-full max-h-full", // Default image styling with containment
              imageClassName
            )}
          />
        </div>
      )}
    </div>
  );
};
