import { Box } from "@/components/box";
import { Feature } from "@/components/feature";

export default function Home() {
  return (
    <div>
      {/* Hero Section - Full Width */}
      <Box
        backgroundColor="bg-black"
        title="EMC Filters"
        subtitle="Precision engineered electronic components"
        buttons={[
          { text: "View Products", variant: "default" },
          { text: "Contact Us", variant: "outline" },
        ]}
        imageSrc="/emc_filter.png"
        imageAlt="EMC Filters"
        imageClassName="w-full max-w-lg"
        contentClassName="flex flex-col items-center justify-center space-y-6 h-2/3 relative z-20"
      />

      {/* Section 2 - Another Hero */}
      <Box
        backgroundColor="bg-white"
        title="Ferrite Cores"
        subtitle="Superior magnetic performance."
        description="Advanced ferrite materials for optimal EMI suppression."
        buttons={[
          { text: "View Products", variant: "default" },
          { text: "Contact Us", variant: "outline" },
        ]}
        imageSrc="/emc_filter.png"
        imageAlt="Ferrite Cores"
        imageClassName="w-full max-w-lg"
        contentClassName="flex flex-col items-center justify-center space-y-6 h-2/3 relative z-20"
      />

      {/* Section 3 - Another Hero */}
      <Box
        backgroundColor="bg-black"
        title="EMC Filters"
        subtitle="Industry-leading noise reduction."
        description="Engineered for demanding industrial applications."
        buttons={[
          { text: "View Products", variant: "default" },
          { text: "Contact Us", variant: "outline" },
        ]}
        imageSrc="/emc_filter.png"
        imageAlt="EMC Filters"
        imageClassName="w-full max-w-lg"
        contentClassName="flex flex-col items-center justify-center space-y-6 h-2/3 relative z-20"
      />

      {/* Section 4 - Another Hero */}
      <Box
        backgroundColor="bg-white"
        title="Power Components"
        subtitle="Reliable. Efficient. Precise."
        description="High-performance components for critical systems."
        buttons={[
          { text: "View Products", variant: "default" },
          { text: "Contact Us", variant: "outline" },
        ]}
        imageSrc="/emc_filter.png"
        imageAlt="Power Components"
        imageClassName="w-full max-w-lg"
        contentClassName="flex flex-col items-center justify-center space-y-6 h-2/3 relative z-20"
      />

      {/* 2x2 Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <Box
          backgroundColor="bg-gray-100"
          height="h-[500px]"
          title="Ferrite Cores"
          subtitle="Superior magnetic performance."
          description="Advanced ferrite materials for optimal EMI suppression."
          buttons={[
            { text: "Learn more", variant: "default" },
            { text: "Buy", variant: "outline" },
          ]}
          imageSrc="/emc_filter.png"
          imageAlt="Ferrite Cores"
          imageClassName="w-full max-w-sm"
          contentClassName="flex flex-col items-center justify-center space-y-4 h-2/3 relative z-20"
        />

        <Box
          backgroundColor="bg-black"
          height="h-[500px]"
          title="EMC Filters"
          subtitle="Industry-leading noise reduction."
          description="Engineered for demanding industrial applications."
          buttons={[
            { text: "Learn more", variant: "default" },
            { text: "Buy", variant: "outline" },
          ]}
          imageSrc="/emc_filter.png"
          imageAlt="EMC Filters"
          imageClassName="w-full max-w-sm"
          contentClassName="flex flex-col items-center justify-center space-y-4 h-2/3 relative z-20"
        />

        <Box
          backgroundColor="bg-blue-100"
          height="h-[500px]"
          title="Power Components"
          subtitle="Reliable. Efficient. Precise."
          description="High-performance components for critical systems."
          buttons={[
            { text: "Learn more", variant: "default" },
            { text: "Buy", variant: "outline" },
          ]}
          imageSrc="/emc_filter.png"
          imageAlt="Power Components"
          imageClassName="w-full max-w-sm"
          contentClassName="flex flex-col items-center justify-center space-y-4 h-2/3 relative z-20"
        />

        <Box
          backgroundColor="bg-gray-200"
          height="h-[500px]"
          title="Signal Transformers"
          subtitle="Precision signal processing."
          description="Custom transformers for specialized applications."
          buttons={[
            { text: "Learn more", variant: "default" },
            { text: "Buy", variant: "outline" },
          ]}
          imageSrc="/emc_filter.png"
          imageAlt="Signal Transformers"
          imageClassName="w-full max-w-sm"
          contentClassName="flex flex-col items-center justify-center space-y-4 h-2/3 relative z-20"
        />
      </div>

      <Feature />
    </div>
  );
}
