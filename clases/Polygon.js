/*
 * Класс - полигон
 */
export default class Polygon{
    constructor(arrayPoints,mapInstanse){
        try{
            //Данные 
            this.mapInstanse = mapInstanse;
            //ГУИ
            //Создает новый полигон
            let p = new ymaps.Polygon([arrayPoints], {}, {
                fillColor: '#0000FF',// Цвет заливки.
                strokeColor: '#0000FF',// Цвет обводки.
                opacity: 0.5,// Общая прозрачность (как для заливки, так и для обводки).
                strokeWidth: 3,// Ширина обводки.
            });
            this.objInstanse = p;
            this.mapInstanse.geoObjects.add(p);// Добавляем многоугольник на карту.
        }catch(e){
            console.log("class Polygon.constructor() : " + e.message)
        }
    }
    foo(){
        console.log(this.objInstanse)
    }
}