/*
 * Copyright (C) 2012-2020  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


export interface IAssociation {
    country: string;
    name: string;
    acronym?: string;
}

export let associations: Array<IAssociation> = [
    {country: "ar", name: "Asociación Argentina de Go", acronym: "AAGo"},
    {country: "am", name: "Armenian Draughts and Go Federation "},
    {country: "au", name: "Australian Go Association", acronym: "AGA"},
    {country: "at", name: "Go Verband Östereich"},
    {country: "az", name: "Azerbaijan GalaGAPI Federation (Azərbaycan Qalaqapı Federasiyası)"},
    {country: "by", name: "Belarusian Go Federation"},
    {country: "be", name: "Belgian Go Federation"},
    {country: "ba", name: "Go Asocijacija Bosne i Hercegovine"},
    {country: "br", name: "Associação Brazil Nippon Kiin"},
    {country: "bn", name: "Brunei Darussalam Go Association"},
    {country: "bg", name: "Българска Го Асоциация"},
    {country: "ca", name: "Canadian Go Association", acronym: "CGA"},
    {country: "cl", name: "Asociación Chilena de Go"},
    {country: "cn", name: "中国围棋协会 (Chinese Weiqi Association)"},
    {country: "co", name: "Asociación Colombiana de Go"},
    {country: "cr", name: "Asociación Costarricense de Go"},
    {country: "hr", name: "Hrvatska Igo Udruga"},
    {country: "cu", name: "El Go en Cuba"},
    {country: "cy", name: "Kypriakos Syndesmos Go"},
    {country: "cz", name: "Ceska Asociace Go"},
    {country: "dk", name: "Dansk Go Forbund"},
    {country: "ec", name: "Asociación Ecuatoriana de Go"},
    {country: "eu", name: "European Go Federation", acronym: "EGF"},
    {country: "fi", name: "Suomen Go-liitto ry "},
    {country: "fr", name: "Fédération Française de Go (French Go Federation)", acronym: "FFG"},
    {country: "ge", name: "Georgian Go Federation"},
    {country: "de", name: "Deutscher Go-Bund"},
    {country: "gt", name: "Club de Igo de Guatemala"},
    {country: "hk", name: "Hong Kong Go Association"},
    {country: "hu", name: "Magyar Goszövetség"},
    {country: "is", name: "Hið Íslenska Gofélag"},
    {country: "in", name: "Indian Amateur Go Association"},
    {country: "id", name: "Indonesia Go Organization"},
    {country: "ir", name: "Baduk Association of I.R of Iran"},
    {country: "ie", name: "Irish Go Association"},
    {country: "il", name: "אגודת הגו הישראלית"},
    {country: "it", name: "Federazione Italiana Giuoco Go"},
    {country: "jp", name: "日本棋院 (Nihon Ki-in)"},
    {country: "kz", name: "Kazakhstan Go Federation"},
    {country: "kp", name: "The Baduk Association of DPR Korea"},
    {country: "kr", name: "한국기원 (Korea Baduk Association)"},
    {country: "lv", name: "Latvijas Go Federācija"},
    {country: "lt", name: "Lietuvos Go Asociacija"},
    {country: "lu", name: "Le Club de Go du Luxembourg "},
    {country: "mo", name: "Clube De Xandrez \"Wei Qi\" De Macau"},
    {country: "mg", name: "Club de Go Madagascar"},
    {country: "my", name: "Malaysia Weiqi Association"},
    {country: "mx", name: "Asociación Mexicana de Go"},
    {country: "mn", name: "Mongolian Go Association"},
    {country: "ma", name: "Association pour la promotion du Go au Maroc"},
    {country: "np", name: "Nepalese Go Association"},
    {country: "nl", name: "Nederlandse Go Bond "},
    {country: "nz", name: "New Zealand Go Society"},
    {country: "no", name: "Norwegian Go Association"},
    {country: "pa", name: "Panamanian Go Association"},
    {country: "pe", name: "Asociacion Peruana de Igo-Shogi"},
    {country: "ph", name: "Philippine Go Association"},
    {country: "pl", name: "Polish Go Association"},
    {country: "pt", name: "Portugal Go Association "},
    {country: "ro", name: "Romanian Go Association "},
    {country: "ru", name: "Russian Go Federation"},
    {country: "rs", name: "Go savez Srbije"},
    {country: "sg", name: "Singapore Weiqi Association "},
    {country: "sk", name: "Slovenska Asociacia Go"},
    {country: "si", name: "Go Zveza Slovenije"},
    {country: "za", name: "South African Go Association"},
    {country: "es", name: "Asociación Española de Go"},
    {country: "se", name: "Svenska Goförbundet "},
    {country: "ch", name: "Swiss Go Association"},
    {country: "tw", name: "中華民國圍棋協會 (Taiwanese Go Association)"},
    {country: "th", name: "Thai Go Association "},
    {country: "tn", name: "Tunisia Go Association"},
    {country: "tr", name: "Turkish Go Players Association"},
    {country: "ua", name: "Ukrainian Go Federation", acronym: "КПДЮ / UFGO"},
    {country: "gb", name: "British Go Association", acronym: "BGA"},
    {country: "us", name: "American Go Association", acronym: "AGA"},
    {country: "uy", name: "Federación Uruguaya de Go"},
    {country: "ve", name: "Asociaciόn Venezolana de Go "},
    {country: "vn", name: "Vietnam Go Association"},
];
