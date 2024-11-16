"use client"
import Color from "color";
import { useEffect } from "react";

type ThemeColors = {
    color_secondary: string;
    color_primary: string;
};

export const RoundThemeUpdater = ({ round }: { round: ThemeColors }) => {
    useEffect(() => {
        const previousPrimary = getComputedStyle(document?.documentElement).getPropertyValue("--primary");
        const previousSecondary = getComputedStyle(document?.documentElement).getPropertyValue("--secondary");
        if (document) {
            const primaryHSL = Color(round.color_primary).hsl().array();
            const secondaryHSL = Color(round.color_secondary).hsl().array();

            document.documentElement.style.setProperty(
                "--primary",
                `${primaryHSL[0]} ${primaryHSL[1]}% ${primaryHSL[2]}%`
            );
            document.documentElement.style.setProperty(
                "--secondary",
                `${secondaryHSL[0]} ${secondaryHSL[1]}% ${secondaryHSL[2]}%`
            );
        }

        return () => {
            if (document) {
                document.documentElement.style.setProperty("--primary", previousPrimary);
                document.documentElement.style.setProperty("--secondary", previousSecondary);
            }
        };

    }, [round]);

    return null;
};