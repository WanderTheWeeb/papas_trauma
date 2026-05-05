import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

const TITLE = "Papa's Trauma Station — ER Edition";
const DESCRIPTION =
    "Atiende a un paciente en urgencias: identifica factores de riesgo, " +
    "explora el hombro, sella el diagnóstico y prescribe el tratamiento. " +
    "Un mini-juego clínico tipo Papers Please construido en Phaser 4 + Next.js.";
const URL = "https://papas-trauma.vercel.app";
const OG_IMAGE = "/screenshot.png";

export default function Home() {
    return (
        <>
            <Head>
                <title>{TITLE}</title>
                <meta name="description" content={DESCRIPTION} />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
                />
                <meta name="theme-color" content="#0b1622" />
                <meta name="application-name" content="Trauma Station" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Trauma Station" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />

                {/* Keywords */}
                <meta
                    name="keywords"
                    content="papers please, trauma, urgencias, juego clínico, papa's, sans, undertale, medicina, hombro, manguito rotador, Phaser, Next.js, juego médico, simulador clínico"
                />
                <meta name="author" content="WanderTheWeeb" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={URL} />
                <meta property="og:title" content={TITLE} />
                <meta property="og:description" content={DESCRIPTION} />
                <meta property="og:image" content={OG_IMAGE} />
                <meta property="og:image:width" content="1280" />
                <meta property="og:image:height" content="720" />
                <meta property="og:locale" content="es_MX" />
                <meta property="og:site_name" content="Trauma Station" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={URL} />
                <meta name="twitter:title" content={TITLE} />
                <meta name="twitter:description" content={DESCRIPTION} />
                <meta name="twitter:image" content={OG_IMAGE} />

                {/* Canonical */}
                <link rel="canonical" href={URL} />

                {/* Icon */}
                <link rel="icon" href="/favicon.png" />
                <link rel="apple-touch-icon" href="/favicon.png" />

                {/* Robots */}
                <meta name="robots" content="index, follow" />
                <meta name="googlebot" content="index, follow" />
            </Head>
            <main className={`${styles.main} ${inter.className}`}>
                <AppWithoutSSR />
                <div id="orient-overlay" role="dialog" aria-modal="true">
                    <div className="icon">↻</div>
                    <h1>Gira tu pantalla</h1>
                    <p>
                        Trauma Station se ve mejor en horizontal. Gira el dispositivo para entrar al
                        turno de urgencias.
                    </p>
                </div>
            </main>
        </>
    );
}
