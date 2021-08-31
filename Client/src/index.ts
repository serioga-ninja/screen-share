import 'webrtc-adapter';
import './components';
import resetStyles from '../assets/styles/index.scss'

const styleElem = document.createElement('style');
styleElem.innerText = resetStyles.cssText;
document.head.append(styleElem);

import app from './app';

app.init();
