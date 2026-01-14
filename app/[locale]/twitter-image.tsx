import { ImageResponse } from 'next/og'

export const alt = 'Artek Elektronik - Premium Magnetic Components'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 50%, #1e3a5f 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Circuit pattern background */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        display: 'flex',
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #60a5fa 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Decorative circles */}
                <div
                    style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.3) 0%, transparent 100%)',
                        display: 'flex',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -150,
                        left: -150,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: 'linear-gradient(0deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%)',
                        display: 'flex',
                    }}
                />

                {/* Main content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    {/* Logo/Icon representation */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 30,
                        }}
                    >
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 30px rgba(59, 130, 246, 0.4)',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 40,
                                    fontWeight: 700,
                                    color: 'white',
                                    letterSpacing: -2,
                                }}
                            >
                                AE
                            </span>
                        </div>
                    </div>

                    {/* Company name */}
                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: 'white',
                            margin: 0,
                            letterSpacing: -2,
                            textAlign: 'center',
                            textShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        ARTEK ELEKTRONİK
                    </h1>

                    {/* Tagline */}
                    <p
                        style={{
                            fontSize: 28,
                            color: '#93c5fd',
                            margin: 0,
                            marginTop: 16,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                        }}
                    >
                        Premium Magnetic Components
                    </p>

                    {/* Decorative line */}
                    <div
                        style={{
                            width: 120,
                            height: 4,
                            background: 'linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)',
                            marginTop: 30,
                            borderRadius: 2,
                            display: 'flex',
                        }}
                    />
                </div>

                {/* Bottom accent */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 6,
                        background: 'linear-gradient(90deg, #1d4ed8 0%, #3b82f6 50%, #1d4ed8 100%)',
                        display: 'flex',
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    )
}
