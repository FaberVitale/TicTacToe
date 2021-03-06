import React, { Component } from 'react';
import '../css/modal.css';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { $id, warn } from '../util/functionUtil';
import { rootId } from '../constants';
import { FaTimesCircle } from 'react-icons/fa';

const modalContentClass = [
  'modal-hidden',
  'modal-trans-hide',
  'modal-visible',
  'modal-visible modal-trans-show',
];
const modalButtonClass = [
  'modal-close-button-hidden',
  'modal-close-button-hidden',
  'modal-close-button-visible',
  'modal-close-button-hidden',
];

const mStates = {
  HIDDEN: 0,
  TRANS_HIDE: 1,
  VISIBLE: 2,
  TRANS_SHOW: 3,
};

/*Modal
 * instance fields:
 *  - modalRoot: the HTMLElement root of the modal
 *  - activator: the element that had focus before the activation of the modal,
 *               it will get the focus back when the modal is
 *               in state TRANS_HIDE
 *  - state:
 *               mState: - represents the current modal state,
 *               its value is one of the values of mStates enum
 */

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mState: mStates.HIDDEN,
    };
  }

  getButtonRef = closeButton => {
    this.closeButton = closeButton;
  };

  getModalContentRef = modalContent => {
    this.modalContent = modalContent;
  };

  componentWillMount() {
    this.modalRoot = $id('modal-root');
    if (!this.modalRoot) {
      this.modalRoot = document.createElement('div');
      this.modalRoot.setAttribute('id', 'modal-root');
      document.body.appendChild(this.modalRoot);
    }
    this.activator = null;
  }

  componentDidMount() {
    this.modalRoot.className = modalContentClass[mStates.HIDDEN];
    this.modalRoot.addEventListener('click', this.handleClickOutside);
    this.modalRoot.addEventListener('animationend', this.handleAnimEnd);
    /* a11y features for the modal
     * screen readers will consider the modal hidden as soon as it is
     * in TRANS_HIDE state
     */
    this.modalRoot.setAttribute('role', 'dialog');
    this.modalRoot.setAttribute('aria-hidden', 'true');
    this.changeState(this.props.shouldShow, mStates.VISIBLE);
  }

  componentWillUnmount() {
    this.modalRoot.removeEventListener('click', this.handleClickOutside);
    this.modalRoot.removeEventListener('animationend', this.handleAnimEnd);
    this.modalRoot.removeAttribute('role');
  }

  changeState = (condition, nextState) => {
    if (condition) {
      this.setState({
        mState: nextState,
      });
    }
  };

  show = () => {
    if (this.state.mState === mStates.HIDDEN) {
      this.setState({
        mState: mStates.TRANS_SHOW,
      });
    }
  };

  hide = () => {
    this.changeState(this.state.mState === mStates.VISIBLE, mStates.TRANS_HIDE);
    this.props.close();
  };

  handleClickOutside = evt => {
    if (evt.target.id === 'modal-root') {
      //closes the window and bubbles up the event through the portal
      this.closeButton.click();
    }
  };

  handleKeyEvents = evt => {
    if (this.state.mState !== mStates.VISIBLE) {
      return;
    }
    switch (evt.key) {
      case 'Escape': //closes the window and bubbles up the event through the portal
        this.closeButton.click();
        break;
      case 'Tab': //shift+Tab or just Tab
        evt.preventDefault();
        break;
      default:
    }
  };

  blurCB = () => {
    if (
      this.closeButton && //it doesnt trigger if the component is unmounted
      this.state.mState === mStates.VISIBLE &&
      document.activeElement !== this.closeButton
    ) {
      this.closeButton.focus();
    }
  };

  handleBlur = evt => {
    setTimeout(this.blurCB, 10);
  };

  handleAnimEnd = evt => {
    if (evt.target !== this.modalRoot) {
      return;
    }
    let nextState = -1;
    let err = null;
    switch (this.state.mState) {
      case mStates.TRANS_HIDE:
        nextState = mStates.HIDDEN;
        break;
      case mStates.TRANS_SHOW:
        nextState = mStates.VISIBLE;
        break;
      case mStates.HIDDEN:
        err = 'hidden modals should not have animations';
        break;
      case mStates.VISIBLE:
        break;
      default:
        err = `invalid state ${this.state.mState}`;
    }
    if (nextState >= mStates.HIDDEN && nextState <= mStates.TRANS_SHOW) {
      this.setState({
        mState: nextState,
      });
    } else {
      warn(err);
    }
  };

  componentWillReceiveProps(nextProps) {
    this.changeState(
      nextProps.shouldShow && this.state.mState === mStates.HIDDEN,
      mStates.TRANS_SHOW,
    );
  }

  updateDOM = () => {
    switch (this.state.mState) {
      case mStates.VISIBLE:
        break;
      case mStates.TRANS_SHOW:
        document.body.style.overflow = 'hidden';
        document.getElementById(rootId).setAttribute('aria-hidden', 'true');
        this.modalRoot.setAttribute('aria-hidden', 'false');
        break;
      case mStates.TRANS_HIDE:
        document.body.style.overflow = 'auto';
        document.getElementById(rootId).removeAttribute('aria-hidden');
        this.modalRoot.setAttribute('aria-hidden', 'true');
        break;
      case mStates.HIDDEN:
        break;
      default:
        warn(`illegal state modal state: ${this.state.mState}`);
    }
    this.modalRoot.className = modalContentClass[this.state.mState];
  };

  componentDidUpdate() {
    window.requestAnimationFrame(this.updateDOM);

    const focused = document.activeElement;

    if (this.state.mState === mStates.TRANS_SHOW) {
      this.activator = document.activeElement;
    }
    if (this.state.mState === mStates.VISIBLE && focused !== this.closeButton) {
      this.closeButton.focus();
    }
    if (this.state.mState === mStates.TRANS_HIDE && this.activator) {
      this.activator.focus();
      this.activator = null;
    }
  }

  render() {
    return ReactDOM.createPortal(
      <div
        id="modal-content"
        className={
          this.state.mState === mStates.TRANS_HIDE
            ? 'modal-content-trans-hide'
            : null
        }
        ref={this.getModalContentRef}
        onKeyDown={this.handleKeyEvents}
        onBlur={this.handleBlur}
        aria-label={this.props.title}
      >
        <button
          type="button"
          onClick={this.hide}
          id="modal-close-button"
          ref={this.getButtonRef}
          className={modalButtonClass[this.state.mState]}
          aria-label="close"
        >
          <FaTimesCircle />
        </button>
        {this.props.children}
      </div>,
      this.modalRoot,
    );
  }
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  shouldShow: PropTypes.bool.isRequired,
  children: PropTypes.any,
  close: PropTypes.func.isRequired,
};

export default Modal;
