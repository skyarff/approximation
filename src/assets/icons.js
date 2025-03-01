import { defineAsyncComponent } from 'vue';

// Используем glob для импорта всех иконок
const iconModules = import.meta.glob('./icons/*.vue');

// Создаем объект с иконками
const icons = {
  DownloadIcon: defineAsyncComponent(() => iconModules['./icons/download.vue']()),
  UploadIcon: defineAsyncComponent(() => iconModules['./icons/upload.vue']()),
  UploadIconTwo: defineAsyncComponent(() => iconModules['./icons/uploadTwo.vue']()),
  PrinterIcon: defineAsyncComponent(() => iconModules['./icons/printer.vue']()),
  FilterIcon: defineAsyncComponent(() => iconModules['./icons/filter.vue']()),
  CheckBoxChecked1Icon: defineAsyncComponent(() => iconModules['./icons/check-box-checked1.vue']()),
  ExpandIcon: defineAsyncComponent(() => iconModules['./icons/expand.vue']()),
  CloseIcon: defineAsyncComponent(() => iconModules['./icons/close.vue']()),
  MinusCircleIcon: defineAsyncComponent(() => iconModules['./icons/minus-circle.vue']()),
  DocumentIcon: defineAsyncComponent(() => iconModules['./icons/document.vue']()),
  ThiknessIcon: defineAsyncComponent(() => iconModules['./icons/thikness.vue']()),
  IntervalIcon: defineAsyncComponent(() => iconModules['./icons/interval.vue']()),
  ClearIcon: defineAsyncComponent(() => iconModules['./icons/clear.vue']()),
  AddCircleSmallIcon: defineAsyncComponent(() => iconModules['./icons/add-circle-small.vue']()),
  AutoIcon: defineAsyncComponent(() => iconModules['./icons/auto.vue']()),
  ClockStartIcon: defineAsyncComponent(() => iconModules['./icons/clock-start.vue']()),
  ClockEndIcon: defineAsyncComponent(() => iconModules['./icons/clock-end.vue']()),
  KeyIcon: defineAsyncComponent(() => iconModules['./icons/key.vue']()),
  LocationIcon: defineAsyncComponent(() => iconModules['./icons/location.vue']()),
  WorkerIcon: defineAsyncComponent(() => iconModules['./icons/worker.vue']()),
  EntranceIcon: defineAsyncComponent(() => iconModules['./icons/entrance.vue']()),
  LiftIcon: defineAsyncComponent(() => iconModules['./icons/lift.vue']()),
  CalendarIcon: defineAsyncComponent(() => iconModules['./icons/calendar.vue']()),
  CheckBoxChecked2Icon: defineAsyncComponent(() => iconModules['./icons/check-box-checked2.vue']()),
  CheckBoxIcon: defineAsyncComponent(() => iconModules['./icons/check-box.vue']()),
  SearchIcon: defineAsyncComponent(() => iconModules['./icons/search.vue']()),
  AddCircleIcon: defineAsyncComponent(() => iconModules['./icons/add-circle.vue']()),
  MenuKebabIcon: defineAsyncComponent(() => iconModules['./icons/menu-kebab.vue']()),
  ListIcon: defineAsyncComponent(() => iconModules['./icons/list.vue']()),
  EditIcon: defineAsyncComponent(() => iconModules['./icons/edit.vue']()),
  BackIcon: defineAsyncComponent(() => iconModules['./icons/back.vue']()),
  StageIcon: defineAsyncComponent(() => iconModules['./icons/stage.vue']()),
  VideoIcon: defineAsyncComponent(() => iconModules['./icons/video.vue']()),
  ClipIcon: defineAsyncComponent(() => iconModules['./icons/clip.vue']()),
  TuneIcon: defineAsyncComponent(() => iconModules['./icons/TuneIcon.vue']()),
  DateIcon: defineAsyncComponent(() => iconModules['./icons/DateIcon.vue']()),
  NotificationIcon: defineAsyncComponent(() => iconModules['./icons/notification.vue']()),
  WarningIcon: defineAsyncComponent(() => iconModules['./icons/warning.vue']()),
  InfoIcon: defineAsyncComponent(() => iconModules['./icons/info-icon.vue']()),
};

export default icons;