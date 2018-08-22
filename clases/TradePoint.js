const queries = {

}
export default class TradePoint{


    //
    //приравнять активную точку к видимой
    //

    //класс характеризующий точку оказания услуги
    constructor(point,mapIsnt,VueContext,properties=null,events=null,draggable=true,services=[]){
        try{
        //данные принимаемые с сервера
        this.pointid = !!point.pointid ? point.pointid : null
        this.latitude = point.latitude;//широта
        this.longitude= point.longitude;//долгота
        this.name = point.name // название точки оказания услуг
        this.address= point.address;//адрес
        this.newPhones = []; //массив для новых номеров телефонов
        this.categories = []; //массив категорий, к которым нужно привязать услугу
        this.services = services;
        //хинт, балун
        
        //преднастройка иконок
        //полезные данные при клике

        // данные вообще 
        this.properties = properties;//и перредаются в DrawMap
        
        this.queries = queries
        
        //гуи
        this.VueContext = VueContext;//контекст экземпляра Vue
        this.mapIsnt = mapIsnt;//контекст яндекс карты
        this.pointInst = this.DrawOnMap(properties,events,draggable);//контекст точки на яндекс карте
        this.setActive(true); // индикатор показывающий, передавать точку на карту или нет 
        this.selected = false //нужен для показа номеров и прочей херни по точке
        }catch(e){
            console.log('DATA')
            console.log(e.message)
        }
    }


    //
    //  добавить методы 
    //

    //добавление телефона к услуге
    addNewPhone(){
        this.newPhones.push({
            "active": true,//показывает активен ли телефон
            "phone": ""//непосредственно номер телефона
        })
    }
    //измененить название на иконке, которое будет соответствовать точке
    changeCaption(){
        this.pointInst.properties.set({
            iconCaption: this.name
        });
    }
    //установить координаты
    setCoords(coords){
        let context = this;
        this.latitude = coords[0];//широта
        this.longitude = coords[1];//долгота
        this.pointInst.geometry.setCoordinates(coords);//меняем координаты метки
        //вычисляем адрес метки, относительно координат
        let res = ymaps.geocode([this.latitude,this.longitude]);
        res.then(res=>{
            let firstGeoObject = res.geoObjects.get(0);
            let address = firstGeoObject.getAddressLine();
            console.log(address);
            context.address = address;
        });
    }
    //установить координаты, по адресу метки
    setCoordsForAdress(){
        let context = this
        let res = ymaps.geocode(this.address);
        console.log(this.address)
        res.then(res=>{
            let coord = res.geoObjects.get(0).geometry.getCoordinates()
            console.log(coord)
            context.setCoords(coord)
        })
        
    }
    //метод отрисовки метки на карте
    DrawOnMap(properties,events,draggable){
        try{
        let context = this

        let p = new ymaps.Placemark([this.latitude,this.longitude], {
            iconCaption: this.name
        }, {
            preset: 'islands#darkblueDotIconWithCaption',
            draggable: draggable
        })

        p.properties.set({
            linkOnStruct: context,//сылка на структуру, для обратной связи
        });
        if(!!properties) p.properties.set({
            ...properties //сохраняем важные данные
        });

        if(!!events) for(let {name,event} of events){
            //click, драг(dragend), двойной клик, наведение
            p.events.add(name, event);
        }
        
        p.properties.set(properties);//кастомные данные пользователя
       // p.events.add('click', this.VueContext.HendlerClickOnPointFromMap);
       // p.events.add('dragend', this.VueContext.HendlerDragend);
        this.mapIsnt.geoObjects.add(p);
        }catch(e){
            console.log('DRAW')
            console.log(e.message)
        }
        return p;
    }
    //установка видимости метки
    SetVisibleOnMap(vis){
        this.pointInst.options.set({ "visible": vis});
    }
    //Активный или нет? (формирует список того, что нужно передать на сервер)
    setActive(val){
        this.SetVisibleOnMap(val);
        this.active = val
    }
    //посчитали индекс квадранта для заданного масштабы
    calculate_index_for_square(coord, scale=500000){
        let tableScale = [];
        // таблица масштабов
        // [масштаб] = [размер широты, оазмер долготы]
        tableScale[500000] = [2, 3];
        let degs = tableScale[scale];//вытащили размеры ячейки из таблицы
        let index = (coord[0] / degs[0]) * (coord[1] / degs[1] + 1);
        return index;
    }
}