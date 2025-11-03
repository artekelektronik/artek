import { Blocks, BookOpen, Palette, Zap } from "lucide-react";

const features = [
  {
    id: "feature-1",
    title: "Certified Quality",
    description:
      "ISO 9001 certified manufacturing with rigorous testing standards.",
    icon: <BookOpen className="size-10" strokeWidth={1.5} />,
  },
  {
    id: "feature-2",
    title: "High Performance",
    description:
      "Optimized for maximum efficiency and minimal signal interference.",
    icon: <Zap className="size-10" strokeWidth={1.5} />,
  },
  {
    id: "feature-3",
    title: "Industry Leading",
    description: "Trusted by leading manufacturers across multiple industries.",
    icon: <Blocks className="size-10" strokeWidth={1.5} />,
  },
  {
    id: "feature-4",
    title: "Global Support",
    description: "Worldwide distribution with local technical support teams.",
    icon: <Palette className="size-10" strokeWidth={1.5} />,
  },
];

const Feature = () => {
  return (
    <section className="relative pt-32 px-4">
      <div className="w-full relative z-10 flex flex-col space-y-14">
        <h2 className="px-6 text-3xl font-semibold md:mb-4 md:text-5xl lg:mb-6 lg:max-w-md lg:px-10">
          Why choose Artek Elektronik
        </h2>
        <p className="px-6 text-xl font-thin text-muted-foreground lg:px-10">
          Precision engineering meets uncompromising quality standards.
        </p>
        <div className="relative mt-6 md:mt-10">
          <div className="bg-border absolute left-0 right-0 top-0 h-px" />
          <div className="divide-border grid md:grid-cols-4 md:divide-x">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="relative px-6 pb-20 md:pb-10 lg:px-10"
              >
                <div className="bg-border absolute left-0 right-0 top-0 h-px md:hidden" />
                <div className="bg-background relative -mt-6 mb-10 flex aspect-square w-12 items-center justify-center md:-mt-10 md:mb-10 md:w-20">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-3 max-w-48 text-lg font-semibold md:mb-4 md:text-2xl lg:mb-6">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-border absolute bottom-0 left-0 right-0 h-px" />
        </div>
      </div>
      <div className="w-full absolute inset-0 hidden h-full md:block">
        <div className="relative h-full">
          {/* <div className="bg-border absolute inset-y-0 left-0 h-full w-px"></div>
          <div className="bg-border absolute inset-y-0 right-0 h-full w-px"></div> */}
        </div>
      </div>
    </section>
  );
};

export { Feature };
