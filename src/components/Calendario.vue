<template>
  <v-container fluid class="pa-0 ma-0 fill-height">
    <v-row no-gutters class="fill-height">
      <v-col :cols="sidebarVisible ? 9 : 12" class="fill-height">
        <!-- Encabezado -->
        <v-sheet color="grey lighten-4" class="pa-4" elevation="4">
          <v-toolbar flat :color="`primary lighten-1`" class="rounded-lg" dark>
            <v-btn outlined class="mr-4" @click="setToday">Hoy</v-btn>
            <v-btn fab text small @click="prev">
              <v-icon small>mdi-chevron-left</v-icon>
            </v-btn>
            <v-btn fab text small @click="next">
              <v-icon small>mdi-chevron-right</v-icon>
            </v-btn>
            <v-toolbar-title class="text-h5 font-weight-bold text-capitalize">{{ title }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-menu bottom right>
              <template v-slot:activator="{ on }">
                <v-btn outlined v-on="on">
                  <span>{{ typeToLabel[type] }}</span>
                  <v-icon right>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list dense>
                <v-list-item @click="type = 'day'">
                  <v-list-item-title>Día</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = 'week'">
                  <v-list-item-title>Semana</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = 'month'">
                  <v-list-item-title>Mes</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = '4day'">
                  <v-list-item-title>4 Días</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn icon @click="toggleSidebar">
              <v-icon>{{ sidebarVisible ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
            </v-btn>
          </v-toolbar>
        </v-sheet>
        <!-- Calendario -->
        <v-sheet class="fill-height">
          <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
          <v-calendar ref="calendar" v-model="focus" color="primary" :events="events" :event-color="getEventColor" :event-margin-bottom="3" :now="today" :type="type" locale="es" @click:event="showEvent" @click:more="viewDay" @click:date="openAddEventDialog" @change="updateRange" class="fill-height calendar-custom"></v-calendar>
          <!-- Modal (Formulario) Agregar/Editar Evento -->
          <v-dialog v-model="dialog" max-width="600" persistent>
            <v-card class="pa-3 rounded-lg" elevation="6">
              <v-card-title class="primary white--text pa-3 rounded-t-lg"> {{ currentlyEditing ? 'Editar Evento' : 'Agregar Evento' }} </v-card-title>
              <v-card-text class="pt-3">
                <v-text-field v-model="name" label="Nombre del Evento" prepend-icon="mdi-calendar" outlined dense required :error-messages="formErrors.name"></v-text-field>
                <v-textarea v-model="details" label="Detalles" prepend-icon="mdi-note" outlined dense rows="2"></v-textarea>
                <v-switch v-model="isMultiDay" label="¿Evento de varios días?" dense color="primary"></v-switch>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="startDate" :label="isMultiDay ? 'Fecha de Inicio' : 'Fecha del Evento'" prepend-icon="mdi-calendar" type="date" outlined dense required :error-messages="formErrors.startDate"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="isMultiDay">
                    <v-text-field v-model="endDate" label="Fecha de Fin" prepend-icon="mdi-calendar-end" type="date" outlined dense required :error-messages="formErrors.endDate"></v-text-field>
                  </v-col>
                </v-row>
                <v-row v-if="!isMultiDay" class="mt-0">
                  <v-col cols="12">
                    <v-switch v-model="isAllDay" label="¿Todo el día?" dense color="primary" @change="onAllDayChange"></v-switch>
                  </v-col>
                </v-row>
                <v-row v-if="!isMultiDay && !isAllDay" class="mt-0">
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="startTime" label="Hora de Inicio" prepend-icon="mdi-clock" type="time" outlined dense :error-messages="formErrors.startTime"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="endTime" label="Hora de Fin" prepend-icon="mdi-clock-end" type="time" outlined dense :error-messages="formErrors.endTime"></v-text-field>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-select v-model="importance" :items="importanceLevels" label="Importancia" prepend-icon="mdi-priority-high" outlined dense item-text="name" item-value="value"></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="eventType" :items="eventTypes" label="Tipo de Evento" prepend-icon="mdi-shape" outlined dense item-text="name" item-value="value" @change="onEventTypeChange"></v-select>
                  </v-col>
                </v-row>
                <v-row v-if="eventType === 'other'">
                  <v-col cols="12">
                    <v-text-field v-model="customEventType" label="Especificar Tipo de Evento" prepend-icon="mdi-text" outlined dense required :error-messages="formErrors.customEventType"></v-text-field>
                  </v-col>
                </v-row>
                <v-row  class="mt-0">
                  <v-col cols="12">
                    <v-select v-model="customColor" :items="colorOptions" label="Color Personalizado" prepend-icon="mdi-palette" outlined dense item-text="name" item-value="value" clearable>
                      <template v-slot:item="{ item }">
                        <v-list-item-content>
                          <v-list-item-title>
                            <v-icon :color="item.value" left>mdi-circle</v-icon>
                            {{ item.name }}
                          </v-list-item-title>
                        </v-list-item-content>
                      </template>
                      <template v-slot:selection="{ item }">
                        <v-icon :color="item.value" left>mdi-circle</v-icon>
                        {{ item.name }}
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions class="px-3 pb-3">
                <v-spacer></v-spacer>
                <v-btn color="grey darken-1" dark depressed class="px-4" @click="cancelEvent">
                  <v-icon left>mdi-close</v-icon>
                  Cancelar
                </v-btn>
                <v-btn color="primary" dark depressed class="px-4" @click="saveEvent" :loading="saving" :disabled="!isFormValid">
                  <v-icon left>mdi-content-save</v-icon>
                  Guardar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Card Detalles de Evento -->
          <v-menu v-model="selectedOpen" :close-on-content-click="false" :activator="selectedElement" offset-x max-width="400" min-width="400">
            <v-card class="rounded-lg event-detail-card" elevation="8" width="400">
              <v-card-title :style="{ backgroundColor: selectedEvent.color }" class="white--text pa-4 d-flex align-center">
                <v-icon color="white" left size="20">{{ selectedEvent.icon }}</v-icon>
                <span class="text-h6 font-weight-bold text-truncate">{{ selectedEvent.name }}</span>
                <v-spacer></v-spacer>
                <v-btn icon small color="white" @click="editEvent(selectedEvent)" class="ml-1">
                  <v-icon size="18">mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon small color="white" @click="confirmDeleteEvent(selectedEvent.id)" class="ml-1">
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="mb-3">
                  <v-chip :color="getImportanceConfig(selectedEvent.importance).color" text-color="white" small class="mb-2">
                    <v-icon left small>mdi-priority-high</v-icon>
                    {{ getImportanceConfig(selectedEvent.importance).name }}
                  </v-chip>
                </div>
                <div class="mb-3">
                  <div class="text-caption text--secondary mb-1">Fecha:</div>
                  <div class="text-body-2 font-weight-medium">
                    <v-icon small color="grey darken-1" class="mr-1">mdi-calendar</v-icon>
                    {{ formatEventDate(selectedEvent) }}
                  </div>
                </div>
                <div class="mb-3">
                  <div class="text-caption text--secondary mb-1">Tipo:</div>
                  <div class="text-body-2">
                    <v-icon small color="grey darken-1" class="mr-1"> {{ selectedEvent.icon }} </v-icon>
                    {{ getEventTypeName(selectedEvent) }}
                  </div>
                </div>
                <div v-if="selectedEvent.details" class="mb-3">
                  <div class="text-caption text--secondary mb-1">Detalles:</div>
                  <div class="text-body-2">{{ selectedEvent.details }}</div>
                </div>
                <div v-if="!selectedEvent.details" class="text-body-2 text--disabled text-center py-2"> Sin detalles adicionales </div>
              </v-card-text>
              <v-card-actions class="pa-4 pt-0">
                <v-btn color="grey darken-1" text block class="rounded-lg" @click="selectedOpen = false">
                  <v-icon left>mdi-close</v-icon>
                  Cerrar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </v-sheet>
      </v-col>

      <!-- Barra lateral -->
      <v-col cols="3" v-if="sidebarVisible" class="fill-height">
        <v-navigation-drawer permanent right class="fill-height sidebar-custom">
          <v-sheet color="grey lighten-5" class="pa-4 fill-height">
            <v-subheader class="text-h6 font-weight-bold px-0">Filtrar Eventos</v-subheader>
            <v-row class="mt-2">
              <v-col cols="12">
                <v-select v-model="sortBy" :items="sortOptions" label="Ordenar por" item-text="name" item-value="value" outlined dense prepend-icon="mdi-sort" @change="filterEvents"></v-select>
              </v-col>
            </v-row>
            <v-row class="mt-0">
              <v-col cols="6">
                <v-select v-model="filterImportance" :items="[{ name: 'Todos', value: 'all' }, ...importanceLevels]" label="Importancia" item-text="name" item-value="value" outlined dense @change="filterEvents"></v-select>
              </v-col>
              <v-col cols="6">
                <v-select v-model="filterTime" :items="timeFilters" label="Temporalidad" item-text="name" item-value="value" outlined dense @change="filterEvents"></v-select>
              </v-col>
            </v-row>
            <v-divider class="my-4"></v-divider>
            <v-subheader class="text-h6 font-weight-bold px-0 d-flex align-center"> Eventos ({{ filteredEvents.length }}) </v-subheader>
            <v-list dense class="event-list-custom">
              <v-list-item v-for="event in filteredEvents" :key="event.id" @click="showEvent({ event })" class="rounded-lg mb-1 event-item-custom" :class="getEventItemClasses(event)">
                <v-list-item-content>
                  <v-list-item-title class="d-flex align-center">
                    <v-icon :color="event.color" left small> {{ event.icon }} </v-icon>
                    <span class="font-weight-medium text-truncate"> {{ event.name }} </span>
                    <v-spacer></v-spacer>
                    <v-chip v-if="sortBy === 'importance'" :color="getImportanceConfig(event.importance).color" text-color="white" x-small class="ml-1"> {{ getImportanceConfig(event.importance).name }} </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle class="mt-1"> {{ formatEventDate(event) }} </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-list-item v-if="!filteredEvents.length">
                <v-list-item-content>
                  <v-list-item-title class="text--disabled">No hay eventos</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-sheet>
        </v-navigation-drawer>
      </v-col>
    </v-row>

    <!-- Alerta/Modal verificar eliminar evnto -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card class="rounded-lg" elevation="6">
        <v-card-title class="error white--text pa-4">
          <v-icon left color="white">mdi-delete-alert</v-icon> Confirmar Eliminación </v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-1 mb-2"> ¿Estás seguro de que quieres eliminar este evento? </p>
          <p class="text-body-2 text--secondary">
            <strong> {{ eventToDelete.name }} </strong>
          </p>
          <p class="text-caption text--secondary"> Esta acción no se puede deshacer. </p>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false" :disabled="deleting"> Cancelar </v-btn>
          <v-btn color="error" depressed  @click="deleteEvent" :loading="deleting">
            <v-icon left>mdi-delete</v-icon>
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar/Mini Alertas para Notificaciones -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" top right shaped>
      <v-icon left color="white">{{ snackbar.icon }}</v-icon>
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { db } from '@/main';
import firebase from 'firebase/app';
import 'firebase/firestore';

export default {
  name: 'CalendarioPage',
  data: () => ({
    // Fechas y configuración formato para calendario
    today: new Date().toISOString().substr(0, 10),
    focus: new Date().toISOString().substr(0, 10),
    type: 'month',
    typeToLabel: {
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      '4day': '4 Días',
    },
    
    // Variables de formulario eventos
    startDate: null,
    endDate: null,
    name: null,
    details: null,
    customColor: null,
    importance: 'media',
    eventType: 'reunion',
    customEventType: null,
    isMultiDay: false,
    isAllDay: true,
    startTime: null,
    endTime: null,
    
    // Estado de la interfaz
    dialog: false,
    currentlyEditing: null,
    sidebarVisible: true,
    loading: false,
    saving: false,
    deleting: false,
    
    // Sistema de notificaciones/mini alertas
    snackbar: {
      show: false,
      message: '',
      color: 'success',
      icon: 'mdi-check-circle',
      timeout: 4000,
    },
    
    // Alerta/Modal verificarion para eliminar
    deleteDialog: false,
    eventToDelete: {},
    
    // Validación de formulario
    formErrors: {
      name: [],
      startDate: [],
      endDate: [],
      customEventType: [],
      startTime: [],
      endTime: [],
    },
    
    // Eventos y filtros de Barra lateral
    events: [],
    filteredEvents: [],
    filterImportance: 'all',
    filterTime: 'all',
    sortBy: 'importance',
    
    // Configuración de eventos seleccionados
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    
    // Variables para el rango del calendario
    start: null,
    end: null,
    
    // Array default importancia
    importanceLevels: [
      { name: 'Crítica', value: 'critica', color: '#B71C1C', priority: 5 },
      { name: 'Alta', value: 'alta', color: '#D32F2F', priority: 4 },
      { name: 'Media', value: 'media', color: '#F57C00', priority: 3 },
      { name: 'Baja', value: 'baja', color: '#0288D1', priority: 2 },
      { name: 'Mínima', value: 'minima', color: '#4CAF50', priority: 1 },
    ],

    // Array default tipo evento
    eventTypes: [
      { name: 'Reunión', value: 'reunion', icon: 'mdi-account-group' },
      { name: 'Tarea', value: 'tarea', icon: 'mdi-checkbox-marked-circle' },
      { name: 'Recordatorio', value: 'recordatorio', icon: 'mdi-bell' },
      { name: 'Evento Personal', value: 'personal', icon: 'mdi-account-heart' },
      { name: 'Cumpleaños', value: 'amigos', icon: 'mdi-cake' },
      { name: 'Otro', value: 'other', icon: 'mdi-text' },
    ],

    // Array default colores personalizados
    colorOptions: [
      { name: 'Rojo', value: '#F44336' },
      { name: 'Azul', value: '#2196F3' },
      { name: 'Verde', value: '#4CAF50' },
      { name: 'Amarillo', value: '#FFEB3B' },
      { name: 'Púrpura', value: '#9C27B0' },
      { name: 'Naranja', value: '#FF9800' },
      { name: 'Rosa', value: '#E91E63' },
      { name: 'Cian', value: '#00BCD4' },
      { name: 'Gris', value: '#9E9E9E' },
      { name: 'Marrón', value: '#795548' },
    ],

    // Array default filtro de tiempo
    timeFilters: [
      { name: 'Todos', value: 'all' },
      { name: 'Vencidos', value: 'past' },
      { name: 'Hoy', value: 'today' },
      { name: 'Futuro', value: 'future' },
    ],

    // Array default filtro de importancia
    sortOptions: [
      { name: 'Por Importancia', value: 'importance' },
      { name: 'Por Fecha', value: 'date' },
      { name: 'Por Nombre', value: 'name' },
      { name: 'Por Tipo', value: 'type' },
    ],
  }),

  computed: {
    // Validación si el formulario es valido
    isFormValid() {
      return this.name &&
             this.name.trim() &&
             this.startDate &&
             (!this.isMultiDay || this.endDate) &&
             (this.eventType !== 'other' || (this.customEventType && this.customEventType.trim()));
    },

    // Calculo de titulo encabezado Mes Año
    title() {
      const currentDate = new Date(this.focus || this.today);
      const monthFormatter = this.monthFormatter;
      const startMonth = monthFormatter({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
      const startYear = currentDate.getFullYear();
      const startDay = currentDate.getDate();
      if (this.type === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const endMonth = monthFormatter({
          year: endOfWeek.getFullYear(),
          month: endOfWeek.getMonth() + 1,
        });
        const endYear = endOfWeek.getFullYear();
        const endDay = endOfWeek.getDate();
        const suffixMonth = startMonth === endMonth ? '' : endMonth;
        const suffixYear = startYear === endYear ? '' : endYear;
        return `${startMonth} ${startOfWeek.getDate()} ${startYear} - ${suffixMonth || startMonth} ${endDay} ${suffixYear || startYear}`;
      } else if (this.type === '4day') {
        const endOf4Days = new Date(currentDate);
        endOf4Days.setDate(currentDate.getDate() + 3);
        const endMonth = monthFormatter({
          year: endOf4Days.getFullYear(),
          month: endOf4Days.getMonth() + 1,
        });
        const endYear = endOf4Days.getFullYear();
        const endDay = endOf4Days.getDate();
        const suffixMonth = startMonth === endMonth ? '' : endMonth;
        const suffixYear = startYear === endYear ? '' : endYear;
        return `${startMonth} ${startDay} ${startYear} - ${suffixMonth || startMonth} ${endDay} ${suffixYear || startYear}`;
      } else if (this.type === 'day') {
        return `${startMonth} ${startDay} ${startYear}`;
      }
      return `${startMonth} ${startYear}`;
    },

    // Formateo de mes para titulo Mes Año de encabezado
    monthFormatter() {
      return this.$refs.calendar?.getFormatter({
        timeZone: 'UTC',
        month: 'long',
      }) || ((date) => new Date(date.year, date.month - 1).toLocaleString('es', { month: 'long' }));
    },
  },
  mounted() {
    this.initializeCalendar();
    this.fetchEvents();
  },

  methods: {

    // Filtra los eventos por importancia de valor
    getImportanceConfig(importance) {
      return this.importanceLevels.find(i => i.value === importance) || this.importanceLevels[2];
    },

    // Get tipo de evento seleccionado
    getEventTypeName(event) {
      if (event.eventType === 'other' && event.customEventType) {
        return event.customEventType;
      }
      const eventType = this.eventTypes.find(t => t.value === event.eventType);
      return eventType ? eventType.name : 'Otro';
    },

    // Estilado de eventos segun importancia
    getEventItemClasses(event) {
      const importance = event.importance;
      const baseClasses = ['transition-all', 'duration-200'];
      switch (importance) {
        case 'critica':
          return [...baseClasses, 'red', 'lighten-5', 'red--text', 'text--darken-4'];
        case 'alta':
          return [...baseClasses, 'orange', 'lighten-5', 'orange--text', 'text--darken-4'];
        case 'media':
          return [...baseClasses, 'amber', 'lighten-5', 'amber--text', 'text--darken-4'];
        case 'baja':
          return [...baseClasses, 'blue', 'lighten-5', 'blue--text', 'text--darken-4'];
        case 'minima':
          return [...baseClasses, 'green', 'lighten-5', 'green--text', 'text--darken-4'];
        default:
          return baseClasses;
      }
    },

    // Snackbar/Mini notificacion
    showNotification(message, type = 'success', timeout = 4000) {
      const config = {
        success: { color: 'success', icon: 'mdi-check-circle' },
        error: { color: 'error', icon: 'mdi-alert-circle' },
        warning: { color: 'warning', icon: 'mdi-alert' },
        info: { color: 'info', icon: 'mdi-information' },
      };
      this.snackbar = {
        show: true,
        message,
        color: config[type].color,
        icon: config[type].icon,
        timeout,
      };
    },

    // Validacion de errores y muestra de alerta
    validateForm() {
      this.formErrors = {
        name: [],
        startDate: [],
        endDate: [],
        customEventType: [],
        startTime: [],
        endTime: [],
      };
      let isValid = true;
      if (!this.name || !this.name.trim()) {
        this.formErrors.name.push('El nombre del evento es requerido');
        isValid = false;
      }
      if (!this.startDate) {
        this.formErrors.startDate.push('La fecha de inicio es requerida');
        isValid = false;
      }
      if (this.isMultiDay && !this.endDate) {
        this.formErrors.endDate.push('La fecha de fin es requerida para eventos de varios días');
        isValid = false;
      }
      if (this.isMultiDay && this.startDate && this.endDate && this.endDate < this.startDate) {
        this.formErrors.endDate.push('La fecha de fin debe ser posterior a la fecha de inicio');
        isValid = false;
      }
      if (!this.isMultiDay && !this.isAllDay) {
        if (!this.startTime) {
          this.formErrors.startTime.push('La hora de inicio es requerida');
          isValid = false;
        }
        if (!this.endTime) {
          this.formErrors.endTime.push('La hora de fin es requerida');
          isValid = false;
        }
        if (this.startTime && this.endTime && this.endTime <= this.startTime) {
          this.formErrors.endTime.push('La hora de fin debe ser posterior a la hora de inicio');
          isValid = false;
        }
      }
      if (this.eventType === 'other' && (!this.customEventType || !this.customEventType.trim())) {
        this.formErrors.customEventType.push('Debe especificar el tipo de evento personalizado');
        isValid = false;
      }
      return isValid;
    },

    // Incializacion de calendario
    initializeCalendar() {
      const today = new Date(this.focus || this.today);
      this.start = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
      this.end = this.start;
      this.$nextTick(() => {
        if (this.$refs.calendar) {
          this.$refs.calendar.checkChange();
        }
      });
    },

    // Conversion de formato de fechas
    convertFirestoreDate(date) {
      if (!date) return null;
      if (date instanceof firebase.firestore.Timestamp) {
        return date.toDate().toISOString().substr(0, 19);
      }
      if (typeof date === 'string') {
        return date;
      }
      if (date instanceof Date) {
        return date.toISOString().substr(0, 19);
      }
      return null;
    },

    // Get eventos de firebase y pintarlos en el calendario
    async fetchEvents() {
      this.loading = true;
      try {
        const snapshot = await db.collection('events').orderBy('start', 'asc').get();
        this.events = snapshot.docs.map(doc => {
          const data = doc.data();
          const startDateTime = this.convertFirestoreDate(data.start);
          const endDateTime = this.convertFirestoreDate(data.end) || startDateTime;
          const importanceConfig = this.importanceLevels.find(i => i.value === data.importance) || this.importanceLevels[2];
          const typeConfig = this.eventTypes.find(t => t.value === data.eventType) || this.eventTypes[0];
          return {
            id: doc.id,
            name: data.name || 'Sin título',
            details: data.details || '',
            start: startDateTime,
            end: endDateTime,
            color: data.color || this.customColor || importanceConfig.color,
            icon: data.icon || (data.eventType === 'other' ? 'mdi-text' : typeConfig.icon),
            importance: data.importance || 'media',
            eventType: data.eventType || 'reunion',
            customEventType: data.customEventType || null,
            isAllDay: data.isAllDay !== undefined ? data.isAllDay : true,
            timed: !data.isAllDay,
          };
        }).filter(event => event.start);
        this.filterEvents();
      } catch (error) {
        console.error('Error al obtener eventos:', error);
        this.showNotification('Error al cargar los eventos', 'error');
        this.events = [];
        this.filteredEvents = [];
      } finally {
        this.loading = false;
      }
    },

    // Filtro y orden de los seleccionado
    filterEvents() {
      let filtered = [...this.events];
      // Filtro por importancia
      if (this.filterImportance !== 'all') {
        filtered = filtered.filter(event => event.importance === this.filterImportance);
      }
      // Filtro por temporalidad
      const today = new Date().toISOString().substr(0, 10);
      if (this.filterTime !== 'all') {
        filtered = filtered.filter(event => {
          const eventStart = event.start.split('T')[0];
          const eventEnd = event.end.split('T')[0];
          switch (this.filterTime) {
            case 'past':
              return eventEnd < today;
            case 'today':
              return eventStart <= today && eventEnd >= today;
            case 'future':
              return eventStart > today;
            default:
              return true;
          }
        });
      }
      // Ordenamiento
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'importance': {
            const priorityA = this.getImportanceConfig(a.importance).priority;
            const priorityB = this.getImportanceConfig(b.importance).priority;
            return priorityB - priorityA;
          }
          case 'date': {
            return new Date(a.start) - new Date(b.start);
          }
          case 'name': {
            return a.name.localeCompare(b.name, 'es');
          }
          case 'type': {
            const typeA = this.eventTypes.find(t => t.value === a.eventType)?.name || 'Otro';
            const typeB = this.eventTypes.find(t => t.value === b.eventType)?.name || 'Otro';
            return typeA.localeCompare(typeB, 'es');
          }
          default: {
            return 0;
          }
        }
      });
      this.filteredEvents = filtered;
    },

    // Formateo de fechas de eventos para mostrar en la barra lateral
    formatEventDate(event) {
      if (!event.start) return 'Fecha no válida';
      const startDate = new Date(event.start);
      const endDate = new Date(event.end || event.start);
      const formatDate = (date) =>
        date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
      const formatTime = (dateStr) => {
        if (!dateStr.includes('T')) return '';
        return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      };
      if (event.isAllDay || event.start === event.end) {
        return formatDate(startDate);
      }
      if (!event.isAllDay && event.start.includes('T')) {
        return `${formatDate(startDate)} ${formatTime(event.start)} - ${formatTime(event.end)}`;
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    },

    // Guarda/Actualiza evento Firebase
    async saveEvent() {
      if (!this.validateForm()) {
        this.showNotification('Por favor, corrige los errores en el formulario', 'warning');
        return;
      }
      this.saving = true;
      try {
        const selectedImportance = this.importanceLevels.find(i => i.value === this.importance) || this.importanceLevels[2];
        const selectedEventType = this.eventTypes.find(t => t.value === this.eventType) || this.eventTypes[0];
        const eventData = {
          name: this.name.trim(),
          details: this.details?.trim() || '',
          start: this.isMultiDay || this.isAllDay ? this.startDate : `${this.startDate}T${this.startTime}`,
          end: this.isMultiDay
            ? this.endDate
            : this.isAllDay
            ? this.startDate
            : `${this.startDate}T${this.endTime}`,
          color: this.customColor || selectedImportance.color,
          importance: this.importance,
          eventType: this.eventType,
          customEventType: this.eventType === 'other' ? this.customEventType?.trim() : null,
          icon: this.eventType === 'other' ? 'mdi-text' : selectedEventType.icon,
          isAllDay: this.isMultiDay ? false : this.isAllDay,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (this.currentlyEditing) {
          await db.collection('events').doc(this.currentlyEditing).update(eventData);
          this.showNotification('Evento actualizado correctamente', 'success');
        } else {
          eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('events').add(eventData);
          this.showNotification('Evento creado correctamente', 'success');
        }
        this.cancelEvent();
        await this.fetchEvents();
      } catch (error) {
        console.error('Error al guardar evento:', error);
        this.showNotification('Error al guardar el evento', 'error');
      } finally {
        this.saving = false;
      }
    },

    // Verificar eliminación de un evento
    confirmDeleteEvent(id) {
      const event = this.events.find(e => e.id === id);
      if (event) {
        this.eventToDelete = event;
        this.deleteDialog = true;
        this.selectedOpen = false;
      }
    },

    // Eliminar evento en Firebase
    async deleteEvent() {
      this.deleting = true;
      try {
        await db.collection('events').doc(this.eventToDelete.id).delete();
        this.deleteDialog = false;
        this.eventToDelete = {};
        await this.fetchEvents();
        this.showNotification('Evento eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar evento:', error);
        this.showNotification('Error al eliminar el evento', 'error');
      } finally {
        this.deleting = false;
      }
    },

    // Abre modal de crear nuevo evento
    openAddEventDialog({ date }) {
      this.dialog = true;
      this.name = null;
      this.details = null;
      this.startDate = date;
      this.endDate = date;
      this.startTime = null;
      this.endTime = null;
      this.importance = 'media';
      this.eventType = 'reunion';
      this.customEventType = null;
      this.isMultiDay = false;
      this.isAllDay = true;
      this.customColor = null;
      this.currentlyEditing = null;
      this.formErrors = {
        name: [],
        startDate: [],
        endDate: [],
        customEventType: [],
        startTime: [],
        endTime: [],
      };
    },

    // Abre modal de editar evento
    editEvent(event) {
      this.dialog = true;
      this.name = event.name;
      this.details = event.details;
      this.startDate = event.start.split('T')[0];
      this.endDate = event.end.split('T')[0];
      this.startTime = event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : null;
      this.endTime = event.end.includes('T') ? event.end.split('T')[1].substring(0, 5) : null;
      this.importance = event.importance || 'media';
      this.eventType = event.eventType || 'reunion';
      this.customEventType = event.customEventType || null;
      this.isMultiDay = event.start !== event.end;
      this.isAllDay = event.isAllDay;
      this.customColor = this.colorOptions.some(c => c.value === event.color) ? event.color : null;
      this.currentlyEditing = event.id;
      this.selectedOpen = false;
      this.formErrors = {
        name: [],
        startDate: [],
        endDate: [],
        customEventType: [],
        startTime: [],
        endTime: [],
      };
    },

    // Cancela crear/editar evento
    cancelEvent() {
      this.dialog = false;
      this.name = null;
      this.details = null;
      this.startDate = null;
      this.endDate = null;
      this.startTime = null;
      this.endTime = null;
      this.importance = 'media';
      this.eventType = 'reunion';
      this.customEventType = null;
      this.isMultiDay = false;
      this.isAllDay = true;
      this.customColor = null;
      this.currentlyEditing = null;
      this.formErrors = {
        name: [],
        startDate: [],
        endDate: [],
        customEventType: [],
        startTime: [],
        endTime: [],
      };
    },

    // Cambio de vista a dia especificado
    viewDay({ date }) {
      this.focus = date;
      this.type = 'day';
    },

    // Color de evento a mostrar en calendario
    getEventColor(event) {
      return event.color || '#0288D1';
    },

    // Determina que la fecha actual es el foco del calendario
    setToday() {
      this.focus = this.today;
      this.type = 'day';
    },

    // Before
    prev() {
      this.$refs.calendar.prev();
    },

    // After
    next() {
      this.$refs.calendar.next();
    },

    // Muestra los detalles de evento en card
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedElement = nativeEvent?.target || document.querySelector('.v-calendar');
        setTimeout(() => (this.selectedOpen = true), 10);
      };
      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }
      if (nativeEvent) {
        nativeEvent.stopPropagation();
      }
    },

    // Actualiza rango de fecha segun lo especificado y vista
    updateRange({ start, end }) {
      this.start = start;
      this.end = end;
    },

    // Visibilidad de Barra Lateral
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
    },

    // Limpieza de campo en seleccion de otros personalizado
    onEventTypeChange() {
      if (this.eventType !== 'other') {
        this.customEventType = null;
        this.formErrors.customEventType = [];
      }
    },

    // Limpieza de horas cuando se activa "Todo el día"
    onAllDayChange() {
      if (this.isAllDay) {
        this.startTime = null;
        this.endTime = null;
        this.formErrors.startTime = [];
        this.formErrors.endTime = [];
      }
    },
  },
};
</script>

<style scoped>
.calendar-custom {
  height: calc(100vh - 112px) !important;
}

.calendar-custom >>> .v-event {
  border-radius: 4px !important;
  font-weight: 500 !important;
}

.calendar-custom >>> .v-event-timed {
  border-radius: 4px !important;
}

.sidebar-custom {
  border-left: 1px solid #e0e0e0 !important;
  background-color: #fafafa !important;
  width: 100% !important;
}

.sidebar-custom >>> .v-navigation-drawer__content {
  padding: 0 !important;
}

.event-list-custom {
  max-height: calc(100vh - 350px);
  overflow-y: auto;
}

.event-item-custom {
  transition: all 0.2s ease !important;
  cursor: pointer !important;
}

.event-item-custom:hover {
  transform: translateX(4px) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

.event-detail-card {
  max-width: 400px !important;
  min-width: 400px !important;
  width: 400px !important;
}

.event-detail-card .v-card__title {
  word-break: break-word !important;
}

.v-snackbar {
  z-index: 9999 !important;
}

.transition-all {
  transition: all 0.2s ease !important;
}

.duration-200 {
  transition-duration: 0.2s !important;
}
</style>