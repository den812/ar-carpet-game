// Управление дорожным движением и соблюдение ПДД
export class TrafficManager {
  constructor(roadSystem) {
    this.roadSystem = roadSystem;
    this.activeCars = [];
    this.intersectionQueues = new Map();
    
    // Инициализация очередей на