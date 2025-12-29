"use client";

import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export const ImageIllustration = () => {
  return (
    <>
      <div className="max-lg:hidden">
        <style jsx>{`
          @keyframes beam-move {
            to {
              stroke-dashoffset: -780;
            }
          }

          @keyframes beam-move-down {
            to {
              stroke-dashoffset: 780;
            }
          }
        `}</style>
        <div className="relative [--color-border-illustration:--alpha(var(--color-zinc-950)/12.5%)] [--color-border:--alpha(var(--color-zinc-950)/10%)]">
          <div className="mask-t-from-65% mask-t-to-85% absolute inset-0">
            <img
              src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1757918054/16-bg_kkevzx.webp"
              alt="Artek Electronics hero background"
              className="opacity-7.5 size-full -scale-100 object-bottom"
              loading="lazy"
            />
          </div>
          <div className="border-b">
            <div className="relative mx-auto grid aspect-video max-w-6xl grid-cols-3 overflow-hidden rounded-2xl lg:px-12">
              <div className="grid grid-cols-2 pr-6">
                <div className="grid h-full grid-rows-3 border-r">
                  <div className="flex flex-col justify-end p-6">
                    <div className="**:rounded-full flex w-full flex-wrap justify-end gap-1 rounded border p-4">
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                      </div>

                      <span className="w-full pt-6 font-mono text-[10px] uppercase">
                        Precision ferrite components.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 grid-rows-2 gap-2 rounded-l-2xl border-y border-l p-2">
                    <div className="bg-linear-to-b to-card/75 ring-border size-full rounded rounded-l-lg ring-1"></div>
                    <div className="bg-linear-to-b to-card/75 ring-border size-full rounded rounded-r-lg ring-1"></div>
                    <div className="bg-linear-to-b to-card/75 ring-border size-full rounded rounded-l-lg ring-1"></div>
                    <div className="bg-linear-to-b to-card/75 ring-border size-full rounded rounded-r-lg ring-1"></div>
                  </div>
                  <div className="m-2 bg-[repeating-linear-gradient(45deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_6px)]"></div>
                </div>
                <div className="grid h-full grid-rows-3 border-r border-dashed p-6">
                  <div>
                    <div
                      aria-hidden
                      className="scale-85 flex w-28 flex-wrap gap-2.5 opacity-75"
                    >
                      {Array.from({ length: 10 }).map((_, index) => (
                        <div
                          key={index}
                          aria-hidden
                          className="h-5 w-2.5 max-sm:last:hidden"
                        >
                          <div className="bg-card rounded-t-xs ring-foreground/5 h-1.5 shadow ring-1" />
                          <div className="bg-foreground/5 border-foreground/10 relative mx-auto h-2 w-2 border-x" />
                          <div className="bg-card rounded-b-xs ring-foreground/5 h-1.5 shadow ring-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mr-auto p-6">
                    <div className="flex gap-1">
                      <div className="size-7 border p-1">
                        <div className="bg-card ring-border size-full ring-1"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-card ring-border size-full ring-1"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-card ring-border size-full ring-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 py-2">
                      <div className="h-1 w-12 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_3px)]" />
                      <div className="flex justify-between gap-4">
                        <div className="h-1.5 w-6 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_3px)]" />
                        <div className="h-1.5 w-10 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_3px)]" />
                      </div>
                    </div>

                    <div className="flex justify-between gap-1">
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full border"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full border"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full border"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="space-y-2 py-2">
                      <div className="w-30 h-2 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1.5px,transparent_1.5px,transparent_4px)]" />
                      <div className="w-18 h-2 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1.5px,transparent_1.5px,transparent_4px)]" />
                    </div>
                    <div className="flex pr-2">
                      <div
                        aria-hidden
                        className="scale-85 flex w-16 flex-wrap justify-center gap-2.5 opacity-75"
                      >
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div
                            key={index}
                            aria-hidden
                            className="h-5 w-2.5 max-sm:last:hidden"
                          >
                            <div className="bg-card rounded-t-xs ring-foreground/5 h-1.5 shadow ring-1" />
                            <div className="bg-foreground/5 border-foreground/10 relative mx-auto h-2 w-2 border-x" />
                            <div className="bg-card rounded-b-xs ring-foreground/5 h-1.5 shadow ring-1" />
                          </div>
                        ))}
                      </div>
                      <div className="mask-b-from-75% -mt-4 ml-auto h-20 w-6 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_3px)]" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-center">
                  <div
                    aria-hidden
                    className="flex items-center gap-3 max-sm:hidden"
                  >
                    <div className="bg-border-illustration h-px w-6" />

                    <div className="ml-auto h-4 w-6 bg-[repeating-linear-gradient(45deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_6px)]" />
                    <div className="ring-border-illustration bg-card size-2 rotate-45 ring-1" />
                  </div>
                  <div className="mx-auto hidden w-fit scale-75 rounded-xl border p-1">
                    <div className="bg-background ring-foreground/5 grid grid-rows-[auto_1fr_auto] rounded-lg p-2 shadow-md ring-1">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                        <div className="h-2 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto]">
                        <div className="w-2 bg-[repeating-linear-gradient(var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="p-2">
                          <div className="bg-muted size-16 rounded-2xl border p-1">
                            <div className="ring-foreground/10 inset-shadow-sm inset-shadow-white bg-linear-to-b flex size-full rounded-[12px] from-emerald-50 to-indigo-200 shadow-xl shadow-indigo-600/35 ring-1">
                              {/* <LogoIcon
                                                                className="m-auto size-5 opacity-75 drop-shadow-md"
                                                                uniColor
                                                            /> */}
                            </div>
                          </div>
                        </div>
                        <div className="w-2 bg-[repeating-linear-gradient(var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                        <div className="h-2 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground m-auto size-0.5 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mx-auto w-fit rounded-xl border p-1">
                    <div className="bg-background ring-foreground/5 grid grid-rows-[auto_1fr_auto] rounded-lg p-1 shadow-md ring-1">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-2 py-1">
                        <span className="font-mono text-xs">PCB</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    aria-hidden
                    className="flex items-center gap-3 max-sm:hidden"
                  >
                    <div className="ring-border-illustration bg-card size-2 rotate-45 ring-1" />
                    <div className="ml-auto h-4 w-6 bg-[repeating-linear-gradient(0deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_6px)]" />
                    <div className="bg-border-illustration h-px w-6" />
                  </div>
                </div>
                <div className="relative mx-auto flex w-14 justify-center">
                  <svg
                    width="48"
                    height="84"
                    viewBox="0 0 48 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 mx-auto w-fit"
                  >
                    <path
                      d="M12 0L12 61.395C12 62.4251 11.6026 63.4155 10.8906 64.1599L2.10943 73.3401C1.3974 74.0845 0.999999 75.0749 0.999999 76.105L0.999998 84"
                      stroke="var(--color-white)"
                      className="drop-shadow-emerald-100 drop-shadow-xs [animation:beam-move_4.4s_linear_infinite]"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                    />
                    <path
                      d="M24 0L24 63L24 74.5L24 84"
                      stroke="var(--color-white)"
                      className="drop-shadow-blue-100 drop-shadow-xs delay-[1s] [animation:beam-move_5.4s_linear_infinite]"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                    />
                    <path
                      d="M47.0078 84L47.0078 52.3045C47.0078 51.2414 46.5846 50.222 45.8316 49.4714L37.1771 40.8452C36.4241 40.0947 36.0009 39.0753 36.0009 38.0121L36.0009 2.07412e-06"
                      stroke="var(--color-white)"
                      className="drop-shadow-purple-300 drop-shadow-xs delay-[2s] [animation:beam-move_5.4s_linear_infinite]"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                    />
                  </svg>

                  <svg
                    width="48"
                    height="84"
                    viewBox="0 0 48 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 0L12 61.395C12 62.4251 11.6026 63.4155 10.8906 64.1599L2.10943 73.3401C1.3974 74.0845 0.999999 75.0749 0.999999 76.105L0.999998 84"
                      stroke="var(--border-illustration)"
                    />
                    <path
                      d="M24 0L24 63L24 74.5L24 84"
                      stroke="var(--border-illustration)"
                    />
                    <path
                      d="M47.0078 84L47.0078 52.3045C47.0078 51.2414 46.5846 50.222 45.8316 49.4714L37.1771 40.8452C36.4241 40.0947 36.0009 39.0753 36.0009 38.0121L36.0009 2.07412e-06"
                      stroke="var(--border-illustration)"
                    />
                  </svg>
                </div>

                <Card />

                <div className="relative mx-auto flex w-14 justify-center">
                  <svg
                    width="48"
                    height="84"
                    viewBox="0 0 48 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 mx-auto w-fit"
                  >
                    <path
                      d="M12 84L12 22.605C12 21.5749 11.6026 20.5845 10.8906 19.8401L2.10943 10.6599C1.3974 9.91547 0.999999 8.92507 0.999999 7.89497L0.999998 4.80825e-07"
                      stroke="var(--color-white)"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                      className="drop-shadow-emerald-100 drop-shadow-sm delay-[1s] [animation:beam-move-down_4.4s_linear_infinite]"
                    />
                    <path
                      d="M24 84L24 21L24 9.5L24 0"
                      stroke="var(--color-white)"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                      className="drop-shadow-blue-100 drop-shadow-sm delay-[0.5s] [animation:beam-move-down_5.4s_linear_infinite]"
                    />
                    <path
                      d="M47.0078 0L47.0078 31.6955C47.0078 32.7586 46.5846 33.778 45.8316 34.5286L37.1771 43.1548C36.4241 43.9053 36.0009 44.9247 36.0009 45.9879L36.0009 84"
                      stroke="var(--color-white)"
                      strokeLinecap="round"
                      strokeDasharray="42 278"
                      className="drop-shadow-purple-300 drop-shadow-sm delay-[2s] [animation:beam-move-down_5.4s_linear_infinite]"
                    />
                  </svg>
                  <svg
                    width="48"
                    height="84"
                    viewBox="0 0 48 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 84L12 22.605C12 21.5749 11.6026 20.5845 10.8906 19.8401L2.10943 10.6599C1.3974 9.91547 0.999999 8.92507 0.999999 7.89497L0.999998 4.80825e-07"
                      stroke="var(--border-illustration)"
                    />
                    <path
                      d="M24 84L24 21L24 9.5L24 0"
                      stroke="var(--border-illustration)"
                    />
                    <path
                      d="M47.0078 0L47.0078 31.6955C47.0078 32.7586 46.5846 33.778 45.8316 34.5286L37.1771 43.1548C36.4241 43.9053 36.0009 44.9247 36.0009 45.9879L36.0009 84"
                      stroke="var(--border-illustration)"
                    />
                  </svg>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="z-1 relative mx-auto w-fit rounded-xl border p-1">
                    <div className="bg-background ring-foreground/5 grid grid-rows-[auto_1fr_auto] rounded-lg p-1 shadow-md ring-1">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-2">
                        <span className="flex items-center gap-2 font-mono text-xs">
                          <CheckCircle2 className="size-3 stroke-emerald-800 *:first:fill-emerald-500/35" />
                          <span>Circuit Ready</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_2px,transparent_2px,transparent_6px)]"></div>
                        <div className="flex size-2">
                          <div className="bg-foreground size-0.75 m-auto rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-y-0 -right-4 my-auto translate-x-px translate-y-2">
                    <svg
                      width="120"
                      height="18"
                      viewBox="0 0 120 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mt-4"
                    >
                      <path
                        d="M0 1L45.9706 1C47.0458 1 48.0757 1.43285 48.8281 2.20094L62.1482 15.7991C62.9005 16.5671 63.9305 17 65.0057 17L120 17"
                        stroke="var(--border-illustration)"
                      />
                    </svg>
                    <svg
                      width="120"
                      height="18"
                      viewBox="0 0 120 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute inset-0 mt-4"
                    >
                      <path
                        d="M0 1L45.9706 1C47.0458 1 48.0757 1.43285 48.8281 2.20094L62.1482 15.7991C62.9005 16.5671 63.9305 17 65.0057 17L120 17"
                        stroke="var(--color-white)"
                        strokeLinecap="round"
                        strokeDasharray="42 278"
                        className="drop-shadow-green-300 drop-shadow-sm delay-[2s] [animation:beam-move_5.4s_linear_infinite]"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-rows-[1fr_auto]">
                <div className="grid grid-cols-2 pl-6">
                  <div className="flex h-full flex-col items-center justify-between border-l border-dashed p-4">
                    <div className="flex flex-col justify-center">
                      <div className="space-y-2 py-2">
                        <div className="h-2 w-32 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_2px)]" />
                        <div className="h-2 w-20 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_2px)]" />
                      </div>
                      <div className="flex">
                        <div
                          aria-hidden
                          className="scale-85 flex w-16 flex-wrap justify-end gap-2.5 opacity-75"
                        >
                          {Array.from({ length: 5 }).map((_, index) => (
                            <div
                              key={index}
                              aria-hidden
                              className="h-5 w-2.5 max-sm:last:hidden"
                            >
                              <div className="bg-card rounded-t-xs ring-foreground/5 h-1.5 shadow ring-1" />
                              <div className="bg-foreground/5 border-foreground/10 relative mx-auto h-2 w-2 border-x" />
                              <div className="bg-card rounded-b-xs ring-foreground/5 h-1.5 shadow ring-1" />
                            </div>
                          ))}
                        </div>
                        <div className="mask-b-from-75% -mt-4 ml-auto h-20 w-6 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_3px)]" />
                      </div>
                    </div>
                    <div className="**:rounded-full flex w-full flex-wrap justify-end gap-1 rounded border p-4">
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                        <div className="size-3 border p-0.5">
                          <div className="bg-linear-to-b to-card/50 size-full rounded-full border"></div>
                        </div>
                      </div>

                      <span className="w-full pt-6 font-mono text-[10px] uppercase">
                        High-quality inductors.
                      </span>
                    </div>

                    <div>
                      <div
                        aria-hidden
                        className="scale-85 flex w-28 flex-wrap justify-end gap-2.5 opacity-75"
                      >
                        {Array.from({ length: 10 }).map((_, index) => (
                          <div
                            key={index}
                            aria-hidden
                            className="h-5 w-2.5 max-sm:last:hidden"
                          >
                            <div className="bg-card rounded-t-xs ring-foreground/5 h-1.5 shadow ring-1" />
                            <div className="bg-foreground/5 border-foreground/10 relative mx-auto h-2 w-2 border-x" />
                            <div className="bg-card rounded-b-xs ring-foreground/5 h-1.5 shadow ring-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="relative grid h-full grid-rows-2 border-l">
                    <div className="m-2 bg-[repeating-linear-gradient(45deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_6px)]"></div>

                    <div className="-mb-2 flex flex-col justify-center rounded-r-xl border-y border-r p-6">
                      <div className="space-y-2 py-2">
                        <div className="h-2 w-32 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_2px)]" />
                        <div className="h-2 w-20 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_2px)]" />
                      </div>
                      <div className="flex">
                        <div
                          aria-hidden
                          className="scale-85 flex w-16 flex-wrap justify-end gap-2.5 opacity-75"
                        >
                          {Array.from({ length: 5 }).map((_, index) => (
                            <div
                              key={index}
                              aria-hidden
                              className="h-5 w-2.5 max-sm:last:hidden"
                            >
                              <div className="bg-card rounded-t-xs ring-foreground/5 h-1.5 shadow ring-1" />
                              <div className="bg-foreground/5 border-foreground/10 relative mx-auto h-2 w-2 border-x" />
                              <div className="bg-card rounded-b-xs ring-foreground/5 h-1.5 shadow ring-1" />
                            </div>
                          ))}
                        </div>
                        <div className="mask-b-from-75% -mt-4 ml-auto h-20 w-6 bg-[repeating-linear-gradient(90deg,var(--color-border-illustration),var(--color-border-illustration)_1px,transparent_1px,transparent_3px)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="aspect-72/41 lg:hidden">
        <Image
          src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1757917121/hero-illustration_nl1gdn.png"
          alt="Artek Electronics hero section"
          width={2304}
          height={1298}
          className="size-full object-cover"
        />
      </div>
    </>
  );
};

const Card = () => {
  return (
    <div className="ring-foreground/10 bg-background relative z-10 flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-sm border px-4 py-3 shadow-lg ring-1">
      {/* Circuit trace pattern background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 200 120"
        preserveAspectRatio="none"
      >
        <path d="M0 20 H60 L70 30 H130 L140 20 H200" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <path d="M0 60 H80 L90 70 H110 L120 60 H200" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <path d="M0 100 H70 L80 90 H120 L130 100 H200" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <path d="M30 0 V40 L40 50 V120" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <path d="M120 0 V50 L130 60 V120" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <path d="M170 0 V70 L160 80 V120" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        {/* Connection dots */}
        <circle cx="70" cy="30" r="2" fill="currentColor"/>
        <circle cx="140" cy="20" r="2" fill="currentColor"/>
        <circle cx="90" cy="70" r="2" fill="currentColor"/>
        <circle cx="40" cy="50" r="2" fill="currentColor"/>
        <circle cx="130" cy="60" r="2" fill="currentColor"/>
      </svg>

      {/* Top row - Small components */}
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-2">
          {/* SMD Components */}
          <div className="flex gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-1.5 h-3 bg-muted rounded-xs border ring-1 ring-border"></div>
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-[9px] block font-mono">ARTEK</span>
          <span className="font-mono text-[8px] font-medium text-foreground/70">ELEKTRONİK</span>
        </div>
      </div>

      {/* Center - Main component: Ferrite Core E-Shape */}
      <div className="relative z-10 flex items-center justify-center gap-3">
        {/* Bobbin/Coil illustration */}
        <BobbinSVG />
        
        {/* Ferrite Core E-Shape */}
        <FerriteCoreEE />
        
        {/* Inductor/Toroid */}
        <ToroidSVG />
      </div>

      {/* Bottom row */}
      <div className="relative z-10 flex justify-between items-end">
        {/* Pin connections */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-0.5 h-2 bg-border"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-muted ring-1 ring-border"></div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[8px] text-muted-foreground">100kHz</span>
          <div className="w-3 h-3 rounded border ring-1 ring-border bg-muted flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ferrite Core EE-Shape SVG
const FerriteCoreEE = () => (
  <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    {/* Outer E-core frame */}
    <rect x="1" y="1" width="38" height="30" rx="2" className="fill-muted stroke-border" strokeWidth="1"/>
    {/* Top window */}
    <rect x="6" y="4" width="12" height="8" rx="1" className="fill-background stroke-border" strokeWidth="0.5"/>
    <rect x="22" y="4" width="12" height="8" rx="1" className="fill-background stroke-border" strokeWidth="0.5"/>
    {/* Bottom window */}
    <rect x="6" y="20" width="12" height="8" rx="1" className="fill-background stroke-border" strokeWidth="0.5"/>
    <rect x="22" y="20" width="12" height="8" rx="1" className="fill-background stroke-border" strokeWidth="0.5"/>
    {/* Center post */}
    <rect x="17" y="4" width="6" height="24" rx="1" className="fill-muted stroke-border" strokeWidth="0.5"/>
    {/* Winding indication lines */}
    <path d="M8 6 H16 M8 8 H16 M8 10 H16" className="stroke-foreground/20" strokeWidth="0.5"/>
    <path d="M24 6 H32 M24 8 H32 M24 10 H32" className="stroke-foreground/20" strokeWidth="0.5"/>
    <path d="M8 22 H16 M8 24 H16 M8 26 H16" className="stroke-foreground/20" strokeWidth="0.5"/>
    <path d="M24 22 H32 M24 24 H32 M24 26 H32" className="stroke-foreground/20" strokeWidth="0.5"/>
  </svg>
);

// Bobbin/Coil SVG
const BobbinSVG = () => (
  <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    {/* Top flange */}
    <rect x="2" y="1" width="20" height="4" rx="1" className="fill-muted stroke-border" strokeWidth="0.5"/>
    {/* Bottom flange */}
    <rect x="2" y="27" width="20" height="4" rx="1" className="fill-muted stroke-border" strokeWidth="0.5"/>
    {/* Core tube */}
    <rect x="6" y="5" width="12" height="22" rx="1" className="fill-background stroke-border" strokeWidth="0.5"/>
    {/* Winding lines */}
    <path d="M7 8 H17 M7 11 H17 M7 14 H17 M7 17 H17 M7 20 H17 M7 23 H17" className="stroke-foreground/25" strokeWidth="1" strokeLinecap="round"/>
    {/* Pins */}
    <rect x="4" y="31" width="2" height="1" className="fill-foreground/30"/>
    <rect x="18" y="31" width="2" height="1" className="fill-foreground/30"/>
  </svg>
);

// Toroid/Inductor SVG
const ToroidSVG = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    {/* Outer ring */}
    <circle cx="14" cy="14" r="12" className="fill-muted stroke-border" strokeWidth="1"/>
    {/* Inner hole */}
    <circle cx="14" cy="14" r="5" className="fill-background stroke-border" strokeWidth="0.5"/>
    {/* Winding segments */}
    <path d="M14 2 L14 5 M20.5 3.5 L18.5 6 M25 8 L22 9.5 M26 14 L23 14 M25 20 L22 18.5 M20.5 24.5 L18.5 22 M14 26 L14 23 M7.5 24.5 L9.5 22 M3 20 L6 18.5 M2 14 L5 14 M3 8 L6 9.5 M7.5 3.5 L9.5 6" className="stroke-foreground/30" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
