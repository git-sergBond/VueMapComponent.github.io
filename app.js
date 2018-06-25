//
// 1 убрать переменные претендующие на удаление
//
import Vue from 'vue';
import YmapPlugin from 'vue-yandex-maps';
//import { runInContext } from 'vm';
Vue.use(YmapPlugin);
new Vue({
  el: '#app',
  data: {
    mapInstanse: null,
    coords: [54.82896654088406, 39.831893822753904],//начальный фокус на карте
    cur_point: null,//текущая выделенная метка на карте (нужно для подсветки)
    //-------------GeoObjects---------
    placemarks: [],//координаты услуг+данные
    polygonEdit: null,
    line: null,
    lineStringGeometry: null,
    //-------------State and GUI-------
    stateApp: 0, //состояние приложения
    /*
    0 - перемешение карты, и просмотр информации о услугах
    1 - редактирование полигона
    2 - редактирвание мышью
    */
    //------------Data------------
    tags: ['Украшения', 'Игрушки', 'Развлечения'],
    cur_tag: [],
    responce: [],
  },
  methods: {
    NewPolygon: function (arrayPoints) {
      //Создает новый полигон
      let p = new ymaps.Polygon([arrayPoints], {}, {
        fillColor: '#0000FF',// Цвет заливки.
        strokeColor: '#0000FF',// Цвет обводки.
        opacity: 0.5,// Общая прозрачность (как для заливки, так и для обводки). 
        strokeWidth: 3,// Ширина обводки.
        
      });
      this.mapInstanse.geoObjects.add(p);// Добавляем многоугольник на карту.
      return p;
    },
    //------------------------DELETE THIS METHOD
    ClearMap: function () {
      //очищает все на карте
      this.mapInstanse.geoObjects.removeAll();
      this.intit_events_DrawPolygonByFinger();
    },
    getInfoForPoligon_from_server: function (coordinates) {
      //асинхронный запрос серверу
      //серверу передается массив точек (вершин полигона)
      //принимается ответ от сервера в виде объекта с координатами и объектом info содержащим данные о чем-то
      console.log('requset to server (json array coordinates)...')//-----------------> отправляю данные координат на сервер !!! дублируется 1 координата
      //console.log(coordinates)
      console.log('... become response (json array plasemarks with info)')//<-----------------  жду ответа
      return responce;
    },
    delete_geoObject(o){
      //Удаление гео объекта с карты
      if(o != null) this.mapInstanse.geoObjects.remove(o);
    },
    click_btn_Start_Edit: function () {
      this.delete_geoObject(this.polygonEdit);
      this.mapInstanse.behaviors.disable('drag');
      this.stateApp = 1;
    },
    //-------- ОБВОДКА ОБЛАСТИ --------------
    intit_events_DrawPolygonByFinger() {
      this.lineStringGeometry = new ymaps.geometry.LineString([]);
      this.line = new ymaps.GeoObject({
        geometry: this.lineStringGeometry,
      }, {
          // Описываем опции геообъекта.
          fillColor: '#00FF00',// Цвет заливки.
          strokeColor: '#0000FF',// Цвет обводки.
          opacity: 0.5,// Общая прозрачность (как для заливки, так и для обводки).
          strokeWidth: 5,// Ширина обводки.
          strokeStyle: 'shortdash'// Стиль обводки.
        });
      this.mapInstanse.geoObjects.add(this.line); // Создаем инстанцию геообъекта и передаем нашу геометрию
      this.mapInstanse.events.add("mousemove", this.mousemove_event_DrawPolygonByFinger);
    },
    mousedown_event_DrawPolygonByFinger(event){
      if (this.stateApp === 1) this.stateApp = 2;
    },
    mousemove_event_DrawPolygonByFinger(event){
      if (this.stateApp !== 2) return;
      let point = event.get('coords');
      let length = this.lineStringGeometry.getLength();
      this.lineStringGeometry.insert(length, point);
    },
    mouseup_event_DrawPolygonByFinger(event){
      if (this.stateApp === 2) {
        if(this.lineStringGeometry.getLength()>2){
          this.stateApp = 1;
          this.Send_Polygon();
        }
      }
    },
    click_btn_Clear: function () {
      //очищаем все метки и полигоны с карты
      //делаем похожую на начальную страницу
      this.stateApp = 0;
      this.ClearMap();
      this.mapInstanse.geoObjects.add(this.line);
      this.add_actions_info();
      this.mapInstanse.behaviors.enable('drag');
    },
    add_placemarks_on_map: function(arr_placemarks){
      //добавление меток на карту и информации о них
      arr_placemarks.forEach(placemark => {
        let p = new ymaps.Placemark(placemark.coords);
        p.events.add('click', this.click_Placemark);
        this.mapInstanse.geoObjects.add(p);
      });
    },
    alg_simplifi_line(arr_in){
      //уменьшение колличества точек на линии
      console.log(arr_in.length)
      let simle_arr = [];
      simle_arr.push(arr_in[0]);
      for (let index = 0; index < arr_in.length; index++) {
        if(index % 5 <= 0) simle_arr.push(arr_in[index]);
      }
      simle_arr.push(arr_in[arr_in.length-1]);
      console.log(simle_arr.length)
      return simle_arr;
    },
    Send_Polygon: function () {
      //ищем среди объектов полигон и отправляем его на сервер 
      let coordinates = this.lineStringGeometry.getCoordinates();
      //!добавляем точку в конец, чтобы не делать преобразований с полигоном
      this.lineStringGeometry.insert(this.lineStringGeometry.getLength(),this.lineStringGeometry.getCoordinates()[0]);
      let simple_line = this.alg_simplifi_line(coordinates);
      this.placemarks = this.getInfoForPoligon_from_server(simple_line);
      this.ClearMap();
      //как пришел ответ идет добавление меток на карту и информации о них
      this.add_placemarks_on_map(this.placemarks);
      this.polygonEdit =  this.NewPolygon(simple_line);
      //возвращаем прежнее состояние приложения и активируем перетаскивание
      this.stateApp = 0;
      this.mapInstanse.behaviors.enable('drag');
    },
    click_Placemark: function (event) {
      //при клике на метке, в блоке информации выделяеются даныне и сама метка
      this.cur_point = event.get('target').geometry.getCoordinates();
      // Цвет всех меток очищается
      let collection = ymaps.geoQuery(this.mapInstanse.geoObjects);
      for (let j = 0; j < collection.getLength(); j++) {
        if (collection.get(j).geometry.getType() === "Point") {
          collection.get(j).options.set(
            'preset', 'twirl#blueStretchyIcon'
          );
        }
      }
      // выделение Цвета текущей метки
      event.get('target').options.set('preset', 'islands#redIcon');
      // переключение  на вкладку с меткой
      for (let i = 0; i < this.placemarks.length; i++) {
        if(this.is_equals_coords(this.placemarks[i].coords)){
          this.cur_tag = this.placemarks[i].tag;
        }
      }
    },
    click_on_card: function(coords){
      //когда нажали на карточку с информацией переходим к выбранной координате
      this.coords = coords;
      let collection = ymaps.geoQuery(this.mapInstanse.geoObjects);
      for (let j = 0; j < collection.getLength(); j++) {
        let point = collection.get(j);
        if (point.geometry.getType() === "Point"){
          let c = point.geometry.getCoordinates();
          if(c[0] == coords[0] && c[1] == coords[1]){
            point.events.fire('click');
          }
        }
      }
    },
    //ФИЛЬТРЫ
    is_equals_coords: function(coords){
      if(this.cur_point == null) return false;
      if (coords[0] == this.cur_point[0] && coords[1] == this.cur_point[1]) return true;
      return false;
    },
    is_share(item){
      return item.type == 'shares';
    },
    is_share_AND_equals_coords(item){
      return this.is_share(item) && this.is_equals_coords(item.coords);
    },
    is_service(item){
      return item.type == 'service';
    },
    is_service_AND_equals_coords(item){
      return this.is_service(item) && this.is_equals_coords(item.coords);
    },
    add_actions_info(){
      //добавление Акций при загрузке компонента
      this.placemarks = shares;
      this.add_placemarks_on_map(this.placemarks);
    },
    //ИНИЦИАЛИЗАТОРЫ
    initHandler: function (myMap) {
      //Инициализация карты
      this.mapInstanse = myMap;
      this.intit_events_DrawPolygonByFinger();
      this.add_actions_info();
    }
  }
})
var shares = [
  {
    type: 'shares',//discounts
    coords: [55.05980129774418, 40.562484643066426],
    name: 'Маникюр - 30%',
    imageUrl: 'images/car1.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 55',
    countReviews: 123,
    stars: 5,
    tag: 'Украшения',
    url: '#1'
  }
];
var responce = [
  {
    type: 'service',
    coords: [55.05980129774418, 40.562484643066426],
    name: 'Золотой слон - подставка',
    imageUrl: 'images/car1.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 55',
    countReviews: 0,
    stars: 2,
    tag: 'Украшения',
    url: '#1'
  },
  {
    type: 'service',
    coords: [57.254808646433844, 39.13975515087893],
    name: 'Игрушечные слоны',
    imageUrl: 'images/car3.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 22',
    countReviews: 43,
    stars: 5,
    tag: 'Игрушки',
    url: '#2'
  },
  {
    type: 'service',
    coords: [55.254808646433844, 40.13975515087893],
    name: 'Игрушечные слоны',
    imageUrl: 'images/car3.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 22',
    countReviews: 43,
    stars: 5,
    tag: 'Игрушки',
    url: '#2'
  },
  {
    type: 'service',
    coords: [60.254808646433844, 39.13975515087893],
    name: 'Игрушечные слоны',
    imageUrl: 'images/car3.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 22',
    countReviews: 43,
    stars: 5,
    tag: 'Игрушки',
    url: '#2'
  },
  {
    type: 'service',
    coords: [60.254808646433844, 39.13975515087893],
    name: 'Игрушечные слоны',
    imageUrl: 'images/car3.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 22',
    countReviews: 43,
    stars: 5,
    tag: 'Игрушки',
    url: '#2'
  },
  {
    type: 'service',
    coords: [55.98721616095246, 39.733016869628926],
    name: 'Зоопарк',
    imageUrl: 'images/car3.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 22',
    countReviews: 1000,
    stars: 3,
    tag: 'Развлечения',
    url: '#3'
  },
  {
    type: 'service',
    coords: [59.98721616095246, 39.733016869628926],
    name: 'Зоопарк',
    imageUrl: 'images/car3.jpg',
    address: 'Белгород, улица Щорса, 123Б',
    phoneNumber: '+ 7 (XXX) XX - 22',
    countReviews: 1000,
    stars: 3,
    tag: 'Развлечения',
    url: '#3'
  }
];

