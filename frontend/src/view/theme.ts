import {createDarkTheme, createLightTheme} from '@fluentui/react-components';
import type {BrandVariants, Theme} from '@fluentui/react-components';
const myNewTheme: BrandVariants = {
    10: "#000500",
    20: "#071E07",
    30: "#00310D",
    40: "#003F14",
    50: "#004D1A",
    60: "#005B21",
    70: "#006A28",
    80: "#00792F",
    90: "#008936",
    100: "#00993E",
    110: "#00A946",
    120: "#00BA4E",
    130: "#00CA56",
    140: "#26DA63",
    150: "#54E97A",
    160: "#86F49A"
};

const lightTheme: Theme = {
    ...createLightTheme(myNewTheme),
};

const darkTheme: Theme = {
    ...createDarkTheme(myNewTheme),
};


darkTheme.colorBrandForeground1 = myNewTheme[110];
darkTheme.colorBrandForeground2 = myNewTheme[120];
export {
    darkTheme,
    lightTheme
}

