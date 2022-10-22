import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import { Checkbox, FormControlLabel,  Fab, Button, Switch, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { AccessAlarm, Settings, Add } from '@material-ui/icons';
import { useSwipeable } from "react-swipeable";
import { getSwRegistration } from "./serviceWorkerRegistration";


const isMock = false;

Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

const timeLeftStep = {
  isFar: 'is-far',
  isClose: 'is-close',
  isVeryClose: 'is-very-close',
}

const isDst  = new Date().isDstObserved()

const getTime = (onChange) => {

  const formatDate = d => d.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})

  if (isMock) {
    const sunset = new Date() ;
    const shabat = new Date();
    onChange({sunset: formatDate(sunset), shabat:formatDate(shabat)})
    return;
  }

  navigator.geolocation.getCurrentPosition(({coords: {latitude, longitude}}) => {
  // Doc - https://sunrise-sunset.org/api
  fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}`)
  .then(response => response.json())
  .then(({results}) => {
      console.log('results', results);
      const sunset = new Date(`6/29/2011 ${results.sunset} UTC`) ;
      const sunsetCurrent = new Date( new Date(sunset).setMinutes(sunset.getMinutes() - (!isDst ? 60 : 0)));
      const shabat = new Date( new Date(sunsetCurrent).setMinutes(sunsetCurrent.getMinutes() - 24));
      onChange({sunset: formatDate(sunsetCurrent), shabat:formatDate(shabat), sunsetRaw:sunsetCurrent , shabatRaw: shabat})
  })
  }, () => {})
}

let intervalId;
const intervalTime = 60000;

const getTimeLeft = ({sunsetRaw, shabatRaw}) => {
    const today = new Date();
    shabatRaw.setFullYear(today.getFullYear());
    shabatRaw.setMonth(today.getMonth());
    shabatRaw.setDate(today.getDate());
    const diffMs = (shabatRaw.getTime() - today.getTime());
    const minsLeft = Math.floor(diffMs / 60000 );
    console.log('minsLeft', minsLeft);
    return minsLeft;
}

const showNotification = (title, options) =>{
  const reg = getSwRegistration();
  reg.showNotification(title, options);
  // navigator.serviceWorker.ready.then(function(registration) {
  //   registration.showNotification(text, options);
  // });
}

const checkTimes = ({sunsetRaw, shabatRaw}, setTimeLeft) => {

  const check = () => {
    const timeLeft = getTimeLeft({sunsetRaw, shabatRaw});
    if((timeLeft > 0 && timeLeft <= 10) || (timeLeft > 20 && timeLeft <= 30)){
      const isVeryClose = timeLeft > 0 && timeLeft <= 10
      setTimeLeft(isVeryClose ? timeLeftStep.isVeryClose : timeLeftStep.isClose);

      const isNotificationEnabled = localStorage.getItem(NOTIFICATION_KEY);
      if(isNotificationEnabled){
        showNotification('Shabat is near', {body: isVeryClose ? 'only less then 10 minutes left' : 'only less then 30 minutes left'})
      }
    }
  }

  check();

  intervalId = setInterval(check, intervalTime)
}

const KEY_TASK = 'keyTask';
const tasksMock = [{name: 'Lights'}, {name: 'Air Conditioner'}, {name: 'Plata'}]
const getTasks = () => JSON.parse(localStorage.getItem(KEY_TASK) || "null") || tasksMock;
const saveTasks = tasks => localStorage.setItem(KEY_TASK, JSON.stringify(tasks));
    let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  // Update UI notify the user they can install the PWA
  // Optionally, send analytics event that PWA install promo was shown.
  console.log(`'beforeinstallprompt' event was fired.`);
});

const installApp = () => {
  deferredPrompt.prompt();
}

const NOTIFICATION_KEY = 'notification'



const SettingsDialog = ({isOpen, onAdd, onClose}) => {
  const [value, setValue] = useState(localStorage.getItem(NOTIFICATION_KEY));

  console.log({value});
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_KEY, value)
  }, [value])

  return (
      <Dialog open={isOpen} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth>
        <DialogTitle id="form-dialog-title">Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            label="Show notification"
            control={
              <Switch
                autoFocus
                margin="dense"
                fullWidth
                checked={value}
                onChange={(event, isChecked) => setValue(isChecked)}
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
  );
}



const FormDialog = ({isOpen, onAdd, onClose}) => {
  const [value, setValue] = useState('');

  const onHandleAdd = () => {
    onAdd(value);
    onClose();
    setValue('');
  }

  return (
      <Dialog open={isOpen} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth>
        <DialogTitle id="form-dialog-title">Adding Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task"
            fullWidth
            value={value}
            onChange={event => setValue(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onHandleAdd} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
  );
}

const Item = ({name, selected, onValueChange, onRemove}) => {
    const [swipeSize, setSwipeSize] = useState(0);

    const swipeHandlers = useSwipeable({
      onSwiping: (eventData) => {
        const {dir, absX} = eventData;
        if (dir === 'Left'){
          setSwipeSize(absX);
        }

      },
      onSwiped: (eventData) => {
        const {dir, absX} = eventData;
        setSwipeSize(0);

        if (dir === 'Left' && absX > 100){
          onRemove(name)
        }
      },
      preventDefaultTouchmoveEvent: true,
      trackMouse: true
    });


  return  (
    <div className={'checkboxContainer'} {...swipeHandlers} style={{    position: 'relative', left: -swipeSize, color: swipeSize ? '#bd5b5b' : undefined}}>
      <FormControlLabel
        control={<Checkbox checked={selected.includes(name)} onChange={() => onValueChange(name)}/>}
        label={name}
        labelPlacement="start"
      />
    </div>
  )
}


function App() {
  const [times, setTimes] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLeftStep.isFar);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingOpen] = useState(false);
  const [tasks, setTasks] = useState(getTasks());

  const showInstallApp = !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)

  const {sunset, shabat} = times;
  const isReady = !!sunset;

  useEffect(() => {
   getTime((newTimes) => {
     setTimes(newTimes)
     checkTimes(newTimes, setTimeLeft);
     Notification.requestPermission().then((result) => {
       console.log('Notification requestPermission', result);
       if (result === 'granted') {
         // checkTimes(newTimes);
       }
     });
   });

  }, [])

  const onValueChange = (name) => {
    if(selected.includes(name)){
      setSelected(selected.filter(v => v !== name))
    }else {
      setSelected([...selected, name])
    }
  }

  const onAdd = (value) => {
    const newTask = [...tasks, {name: value}];
    setTasks(newTask);
    saveTasks(newTask);
  }

  const onRemove = (value) => {
    const newTask = [...tasks.filter(({name}) => name !== value)];
    setTasks(newTask);
    saveTasks(newTask);
  }


  return (
    <div className="App">
      {showInstallApp &&
      <div className={'install-btn'}>
        <Button onClick={installApp}  color="primary">Install app</Button>
      </div>
     }
    <div className={'container'}>
      <div className={'timeContainer'} >
        <div className={`header ${isReady ? 'slide-up-1' : '' }`}>{shabat}</div>
        <div className={`subHeader ${isReady ? 'slide-up-1' : '' }`}>Shabat</div>
        <div className={`header ${isReady ? 'slide-up-2' : '' }`}>{sunset}</div>
        <div className={`subHeader ${isReady ? 'slide-up-2' : '' }`}>Sunset</div>
        <div className={`sun ${timeLeft}`}/>
        {/*<svg className={'wave'} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">*/}
        {/*  <path fill="white" fill-opacity="1" d="M0,288L60,272C120,256,240,224,360,213.3C480,203,600,213,720,213.3C840,213,960,203,1080,170.7C1200,139,1320,85,1380,58.7L1440,32L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>*/}
        {/*</svg>*/}
      </div>
      <Fab className={'addButton'} aria-label="add" onClick={() => setIsAddOpen(true)}>
        <Add />
      </Fab>
      <Fab className={'settingsButton'} aria-label="add" onClick={() => setIsSettingOpen(true)}>
        <Settings />
      </Fab>
      <div className={'taskContainer'} >
        {tasks.map(({name}) => (
          <Item name={name} selected={selected} onValueChange={onValueChange} onRemove={onRemove} />
        ))}
      </div>

      <FormDialog isOpen={isAddOpen} onAdd={onAdd} onClose={() => setIsAddOpen(false)}/>
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingOpen(false)}/>

      {/*<BottomNavigation*/}
      {/*  value={page}*/}
      {/*  onChange={(event, newValue) => {*/}
      {/*    setPage(newValue);*/}
      {/*  }}*/}
      {/*  className={'footer'}*/}
      {/*>*/}
      {/*  <BottomNavigationAction  icon={<AccessAlarm />} />*/}
      {/*  <BottomNavigationAction  icon={<Settings />} />*/}
      {/*</BottomNavigation>*/}
    </div>
    </div>
  );
}

export default App;
