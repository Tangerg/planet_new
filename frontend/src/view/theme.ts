import {createDarkTheme, createLightTheme} from '@fluentui/react-components';
import type {BrandVariants, Theme} from '@fluentui/react-components';

const theme: BrandVariants = {
    10: "#000500",
    20: "#051E08",
    30: "#003110",
    40: "#003F17",
    50: "#004D1E",
    60: "#005B25",
    70: "#006A2D",
    80: "#007934",
    90: "#00893C",
    100: "#009945",
    110: "#00A94D",
    120: "#00B956",
    130: "#00CA5E",
    140: "#00DB68",
    150: "#00EC71",
    160: "#00FE7A"
};

const lightTheme: Theme = {
    ...createLightTheme(theme),
};

const darkTheme: Theme = {
    ...createDarkTheme(theme),
};

darkTheme.colorBrandForeground1 = theme[110]; // use brand[110] instead of brand[100]
darkTheme.colorBrandForeground2 = theme[120]; // use brand[120] instead of brand[110]

export {
    darkTheme,
    lightTheme
}

