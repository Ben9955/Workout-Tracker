'use strict';

// selectors
const form = document.querySelector('.form');
const inputType = document.querySelector('#type');
const inputDistance = document.querySelector('#distance');
const inputDuration = document.querySelector('#duration');
const inputCadence = document.querySelector('#cadence');
const inputElevation = document.querySelector('#elevation');

const workoutBoxe = document.querySelector('.workout');
const workoutsContainer = document.querySelector('.workouts-container');

const confermation = document.querySelector('.delete-workouts');

const menuBtns = document.querySelector('.btns');

const workoutMenu = document.querySelectorAll('.workout-options');

//

let inputTypeEdit,
  inputDistanceEdit,
  inputDurationEdit,
  inputCadenceEdit,
  inputElevationEdit,
  formEdit;

//

//

//
class Workout {
  date = new Date();
  id = (+new Date() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _createScript() {
    const date = new Intl.DateTimeFormat(navigator.language, {
      day: 'numeric',
      year: 'numeric',
      month: 'long',
    }).format(this.date);

    this.script =
      this.type.slice(0, 1).toUpperCase() + this.type.slice(1) + ' ' + date;
  }
}

//

///

class Running extends Workout {
  type = 'running';
  // script = 'Running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);

    this.cadence = cadence;
    this.calcPace();

    this._createScript();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace;
  }
}

//
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);

    this.elevation = elevation;
    this.calcSpeed();
    this._createScript();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(2);
    return this.speed;
  }
}
//

//
//

class App {
  #map;
  #mapEvt;
  #workouts = [];
  #marks = [];
  sort = true;

  constructor() {
    this._getLocation();
    inputType.addEventListener('change', this._checkTypeWorkout.bind(this));
    form.addEventListener('submit', this._newWorkout.bind(this));
    this._getLocalStorage();

    workoutsContainer.addEventListener(
      'click',
      this._checkWorkoutEvent.bind(this)
    );

    menuBtns.addEventListener('click', this._managebtns.bind(this));

    document.body.addEventListener('click', this._handleClick.bind(this));
  }

  _getLocation() {
    //check if the broweser support  geolocation
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('We can not get access to your position');
      }
    );
  }

  // load map

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    // render all workouts saved in the local storage

    this.#workouts.forEach(work => {
      this._renderMerk(work);
    });
  }

  _showForm(event) {
    const formEdit = document.querySelector('.form-edit');
    const deleteAll = document.querySelector('.delete-workouts-active');
    if (formEdit || deleteAll) return;
    this.#mapEvt = event;

    form.classList.toggle('form-hidden');
    inputDistance.focus();
  }

  // check which workout is selected so we can show cadence or elevation
  _checkTypeWorkout(e) {
    inputCadence
      .closest('.input-container')
      .classList.toggle('form__row--hidden');

    inputElevation
      .closest('.input-container')
      .classList.toggle('form__row--hidden');
  }

  // reset input

  _restInputs() {
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';
    //
    form.classList.add('form-hidden');
  }

  // new workout

  _newWorkout(e) {
    e.preventDefault();
    let workout;

    //get values from form
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvt.latlng;
    const coords = [lat, lng];

    const checkNum = (...values) =>
      values.every(value => Number.isFinite(value));
    const checkGreater = (...values) => values.every(val => val > 0);

    //

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !checkNum(distance, duration, cadence) ||
        !checkGreater(distance, duration, cadence)
      )
        return alert('Inputs must be numbers and greater than 0');

      workout = new Running(distance, duration, coords, cadence);
      this.#workouts.push(workout);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !checkNum(distance, duration, elevation) ||
        !checkGreater(distance, duration)
      )
        return alert('Inputs must be numbers and greater than 0');

      workout = new Cycling(distance, duration, coords, elevation);
      this.#workouts.push(workout);
    }
    console.log(workout);

    //
    this._setLocaleStorage();
    // render workout in the list
    this._renderWorkout(workout);

    this._renderMerk(workout);

    // reset inputs and close form
    this._restInputs();
  }

  //

  _renderMerk(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,

          closeOnClick: false,
          autoClose: false,
          className: `popup-${workout.type}`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♀️' : '🚴‍♀️ '} ${workout.script}`
      )
      .openPopup();
    this.#marks.push(marker);
  }

  //
  _renderWorkout(workout, edit = false, container) {
    let html = `
    <li class="workout ${workout.type}-border" data-id=${workout.id}>
      <div class="workout-header">
        <h2 class="title-workout">${workout.script}</h2>
        <i class="fa-solid fa-ellipsis"></i>
        <div class="workout-options">
          <div class="icon-header icon-header-pen">
            <i class="fa-regular fa-pen-to-square"></i>
            <span>Edit</span>
          </div>
          <div class="icon-header icon-header-delete">
            <i class="fa-regular fa-circle-xmark"></i>
            <span>Delete workout</span>
          </div>
        </div>
      </div>
    
      <div class="workout-details">
        <div class="workout-detail">
          <span class="workout-icon">${
            workout.type === 'running' ? '🏃‍♀️' : '🚴‍♀️'
          }</span>
          <div>
            <span class="workout-value">${workout.distance}</span>
            <span class="workout-unit">km</span>
          </div>
        </div>
    
        <div class="workout-detail">
          <span class="workout-icon">⏱</span>
          <div>
            <span class="workout-value">${workout.duration}</span>
            <span class="workout-unit">min</span>
          </div>
        </div>
        `;

    if (workout.type === 'running')
      html += `
    
    <div class="workout-detail">
    <span class="workout-icon">⚡</span>
    <div>
      <span class="workout-value">${workout.pace}</span>
      <span class="workout-unit">min/km</span>
    </div>
    </div>
    
    <div class="workout-detail">
    <span class="workout-icon">🦶</span>
    <div>
      <span class="workout-value">${workout.cadence}</span>
      <span class="workout-unit">spm</span>
    </div>
    </div>
    </div>
    </li>`;

    if (workout.type === 'cycling')
      html += `
    
    <div class="workout-detail">
                  <span class="workout-icon">⚡</span>
                  <div>
                    <span class="workout-value">${workout.speed}</span>
                    <span class="workout-unit">km/h</span>
                  </div>
                </div>
    
                <div class="workout-detail">
                  <span class="workout-icon">⛰</span>
                  <div>
                    <span class="workout-value">${workout.elevation}</span>
                    <span class="workout-unit">m</span>
                  </div>
                </div>
              </div>
            </li> 
    
    `;

    if (!edit) workoutsContainer.insertAdjacentHTML('beforeend', html);

    if (edit) {
      container.insertAdjacentHTML('afterend', html);
      container.remove();
    }
  }

  //  Save the workouts in the locale storage
  _setLocaleStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  // get workouts from localST
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workouts = data;
    data.forEach(obj => this._renderWorkout(obj));
  }

  // move the map once we click on the workout

  _moveToMarker(container) {
    // const container = e.target.closest('.workout');

    // if (!container) return;

    const workout = this.#workouts.find(
      work => work.id === container.dataset.id
    );
    if (!workout) return;

    this.#map.setView(workout.coords, 13);
  }

  /*
  
  

  
  
  */
  // delete all workouts
  _deleteAllWorkouts() {
    const formEdit = document.querySelector('.form-edit');
    if (formEdit) return;
    confermation.classList.add('delete-workouts-active');
    confermation.addEventListener('click', this._deleteConfirm.bind(this));
  }
  _deleteConfirm(e) {
    const confirm = e.target.classList.contains('ok-delete');
    const dontDel = e.target.classList.contains('no-delete');

    if (!confirm && !dontDel) return;

    if (dontDel) confermation.classList.remove('delete-workouts-active');

    if (confirm) {
      localStorage.removeItem('workouts');
      location.reload();
    }
  }

  //sort workouts by data
  _sortWrkouts(sort) {
    const formEdit = document.querySelector('.form-edit');
    const deleteAll = document.querySelector('.delete-workouts-active');
    if (formEdit || deleteAll) return;
    let workoutSorted;

    if (sort) {
      workoutSorted = this.#workouts.slice().sort((a, b) => {
        if (parseInt(a.id) > parseInt(b.id)) return -1;
        if (parseInt(b.id) < parseInt(a.id)) return 1;
      });
      this.sort = false;
    }

    if (!sort) {
      workoutSorted = this.#workouts.slice().sort((a, b) => {
        if (parseInt(a.id) < parseInt(b.id)) return -1;
        if (parseInt(b.id) > parseInt(a.id)) return 1;
      });
      this.sort = true;
    }

    const workouts = document.querySelectorAll('.workout');
    workouts.forEach(w => w.remove());
    workoutSorted.forEach(w => this._renderWorkout(w));
  }

  _viewAll() {
    var group = L.featureGroup(this.#marks).addTo(this.#map);
    this.#map.fitBounds(group.getBounds());
  }

  // check header btns
  _managebtns(e) {
    const btn =
      e.target.closest('.delete-all') ||
      e.target.closest('.view-all') ||
      e.target.closest('.sort');

    if (!btn) return;
    if (e.target.closest('.delete-all')) this._deleteAllWorkouts();

    if (e.target.closest('.view-all')) this._viewAll();

    if (e.target.closest('.sort')) this._sortWrkouts(this.sort);
  }

  // delete single workout
  _openMenu(workout) {
    document
      .querySelectorAll('.workout-options')
      .forEach(menu => menu.classList.remove('workout-options-view'));

    workout.nextElementSibling.classList.toggle('workout-options-view');

    workout.nextElementSibling.addEventListener(
      'click',
      this._handleMenuClick.bind(this)
    );
  }

  ////// remove workout and marker function

  _removeWorkMarker(container) {
    container.classList.add('workout-hidden');
    // setTimeout(() => container.closest('.workout').remove(), 1000);

    const workout = this.#workouts.find(
      work => work.id == container.dataset.id
    );
    const workoutIndex = this.#workouts.indexOf(workout);

    const marker = this.#marks.find(
      mark =>
        mark._latlng.lat === workout.coords[0] &&
        mark._latlng.lng === workout.coords[1]
    );

    const markerIndex = this.#marks.indexOf(marker);

    this.#map.removeLayer(marker);
    setTimeout(() => container.remove(), 1000);
    this.#workouts.splice(workoutIndex, 1);
    this.#marks.splice(markerIndex, 1);
    this._setLocaleStorage();
  }

  _handleMenuClick(e) {
    if (e.target.closest('.icon-header-delete')) {
      const container = e.target.closest('.workout');
      this._removeWorkMarker(container);
    }

    if (e.target.closest('.icon-header-pen')) {
      const container = e.target.closest('.workout');
      this._editWorkout(container);
    }
  }

  ///

  _checkTypeEditt(e) {
    inputCadenceEdit
      .closest('.edit-input')
      .classList.toggle('form__row--hidden');
    inputElevationEdit
      .closest('.edit-input')
      .classList.toggle('form__row--hidden');
  }

  // edit workout
  _editWorkout(container) {
    this._manageForm(container);

    inputTypeEdit = document.querySelector('#type-edit');
    inputDistanceEdit = document.querySelector('#distance-edit');
    inputDurationEdit = document.querySelector('#duration-edit');
    inputCadenceEdit = document.querySelector('#cadence-edit');
    inputElevationEdit = document.querySelector('#elevation-edit');
    formEdit = document.querySelector('.form-edit');

    container
      .querySelector('.workout-options')
      .classList.remove('workout-options-view');

    inputTypeEdit.addEventListener('change', this._checkTypeEditt);

    setTimeout(() => formEdit.classList.add('form-edit-move'), 300);
    const editBtns = document.querySelector('.btns-edit');

    editBtns.addEventListener('click', this._manageEditBtns.bind(this));
  }

  _manageEditBtns(e) {
    e.preventDefault();
    const cancelBtn = e.target.classList.contains('edit-cancel');
    const confirmBtn = e.target.classList.contains('edit-confirm');

    if (!cancelBtn && !confirmBtn) return;

    const formEdit = e.target.closest('.form-edit');
    if (cancelBtn) {
      formEdit.classList.remove('form-edit-move');
    }

    if (confirmBtn) {
      const container = e.target.closest('.workout');
      const oldWorkout = this.#workouts.find(
        work => work.id === container.dataset.id
      );
      this._replaceWorkout(oldWorkout, container);
    }
  }

  // create replace workout

  _replaceWorkout(oldWorkout, container) {
    let indexOldWorkout = this.#workouts.indexOf(oldWorkout);
    const oldMark = this.#marks.find(
      m =>
        oldWorkout.coords[0] === m._latlng.lat &&
        oldWorkout.coords[1] === m._latlng.lng
    );

    console.log(oldMark);

    const indexOldMark = this.#marks.indexOf(oldMark);

    let workout;

    //get values from form
    const distance = +inputDistanceEdit.value;
    const duration = +inputDurationEdit.value;
    const type = inputTypeEdit.value;
    // const { lat, lng } = this.#mapEvt.latlng;
    const coords = oldWorkout.coords;

    const checkNum = (...values) =>
      values.every(value => Number.isFinite(value));
    const checkGreater = (...values) => values.every(val => val > 0);

    //

    if (type === 'running') {
      const cadence = +inputCadenceEdit.value;

      if (
        !checkNum(distance, duration, cadence) ||
        !checkGreater(distance, duration, cadence)
      )
        return alert('Inputs must be numbers and greater than 0');

      workout = new Running(distance, duration, coords, cadence);
      this.#workouts.splice(indexOldWorkout, 1, workout);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !checkNum(distance, duration, elevation) ||
        !checkGreater(distance, duration)
      )
        return alert('Inputs must be numbers and greater than 0');

      workout = new Cycling(distance, duration, coords, elevation);
      this.#workouts.splice(indexOldWorkout, 1, workout);
    }

    //
    this._setLocaleStorage();
    // render workout in the list
    this._renderWorkout(workout, true, container);

    // this.#marks.repl
    this.#map.removeLayer(oldMark);
    this._renderMerk(workout);

    // reset inputs and close form
    // this._restInputs();
  }

  // add form to the workout

  _manageForm(container) {
    const html = `
  <form class="form-edit">
            <div class="edit-input">
              <label for="type-edit">Type</label>
              <select name="" id="type-edit">
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
              </select>
            </div>

            <div class="edit-input">
              <label for="distance-edit">Distance</label>
              <input
                type="text"
                id="distance-edit"
                class="form-input-edit"
                placeholder="km"
              />
            </div>

            <div class="edit-input">
              <label for="duration-edit">Duration</label>
              <input
                type="text"
                id="duration-edit"
                class="form-input-edit"
                placeholder="min"
              />
            </div>

            <div class="edit-input ">
              <label for="cadence-edit">Cadence</label>
              <input
                type="text"
                id="cadence-edit"
                class="form-input-edit"
                placeholder="step/min"
              />
            </div>

            <div class="form__row--hidden edit-input">
              <label for="elevation-edit">Elev Gain</label>
              <input
                type="text"
                id="elevation-edit"
                class="form-input-edit"
                placeholder="meters"
              />
            </div>
            <div class="btns-edit">
              <button class="edit-confirm" type="submit">OK</button>
              <button class="edit-cancel">Cancel</button>
            </div>
          </form>
  
  `;

    container.insertAdjacentHTML('beforeend', html);
  }
  ///

  _checkWorkoutEvent(e) {
    const formEdit = document.querySelector('.form-edit');
    const deleteAll = document.querySelector('.delete-workouts-active');
    if (formEdit || deleteAll) return;
    const container =
      e.target.closest('.fa-ellipsis') || e.target.closest('.workout');

    if (!container) return;

    if (e.target.closest('.fa-ellipsis')) {
      this._openMenu(container);
      return;
    }

    if (e.target.closest('.workout')) this._moveToMarker(container);
  }

  //

  //

  _handleClick(e) {
    if (
      e.target.closest('.fa-ellipsis') ||
      e.target.closest('.workout-options')
    )
      return;

    document
      .querySelectorAll('.workout-options')
      .forEach(menu => menu.classList.remove('workout-options-view'));
  }
}

////////////////////////////////////////////////

const app = new App();
