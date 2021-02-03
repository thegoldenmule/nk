import { Alert, Button, Col, Container, Form, Modal, Nav, Navbar, Row, Spinner } from 'react-bootstrap';
import { connect } from 'react-redux';
import { getContext, getIsLoggedIn, } from './slices/nkSlice';
import {
  getLogin, initLogin,
  loginPhases,
  submitPasswordLogin,
  updatePasswordLogin
} from './slices/loginSlice';
import { useEffect, useRef } from 'react';
import {
  getRegister,
  initRegister,
  registrationPhases,
  submitPasswordRegister, updatePasswordConfirmationRegister,
  updatePasswordRegister
} from './slices/registerSlice';

const ProfileView = ({
  isLoggedIn, login, register,
  dispatchLoginInit, dispatchUpdateLoginPassword, dispatchSubmitLoginPassword,
  dispatchRegisterInit, dispatchUpdateRegisterPassword, dispatchUpdateRegisterPasswordConfirmation, dispatchSubmitRegisterPassword,
  dispatchLogout, }) => {

  const { phase: loginPhase, value: loginValue, error: loginError, } = login;
  const { phase: registerPhase, value: registerValue, valueConfirmation, error: registerError, } = register;

  const renderPhase = () => {
    if (isLoggedIn) {
      return (
        <Nav>
          <Navbar.Text>Signed in.&nbsp;&nbsp;</Navbar.Text>
          <Button
            variant={'outline-secondary'}
            onClick={() => dispatchLogout()}
          >Logout</Button>
        </Nav>
      );
    }

    if (loginPhase === loginPhases.decrypting || registerPhase === registrationPhases.registering) {
      return (
        <Nav>
          <Spinner animation={'border'} size={'sm'} role={'status'} />
        </Nav>
      );
    }

    if (loginPhase === loginPhases.completeAnonymous || loginPhase === loginPhases.uninitialized) {
      return (
        <Nav>
          <Button
            className={'mr-sm-2'}
            onClick={() => dispatchRegisterInit()}
          >
            Register
          </Button>
        </Nav>
      );
    }

    if (loginPhase === loginPhases.requestingCredentials || registerPhase === registrationPhases.requestingCredentials) {
      return (
        <></>
      );
    }
  };

  useEffect(() => dispatchLoginInit(), []);
  const passwordRef = useRef(null);
  useEffect(() => passwordRef.current && passwordRef.current.focus());

  const isValidRegisterPassword = registerValue
    && valueConfirmation
    && registerValue === valueConfirmation
    && registerValue.length >= 8;

  return (
    <div>
      <Modal centered backdrop={'static'} show={loginPhase === loginPhases.requestingCredentials}>
        <Modal.Header>
          <Modal.Title>Please enter your password.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            ref={passwordRef}
            size={'sm'}
            type={'password'}
            placeholder={'Password'}
            value={loginValue}
            onChange={evt => dispatchUpdateLoginPassword(evt.target.value)}
          />
          {
            loginError && <div className={'pt-4'}><Alert variant={'danger'}>{loginError}</Alert></div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant={'primary'} onClick={() => dispatchSubmitLoginPassword()}>Login</Button>
        </Modal.Footer>
      </Modal>
      <Modal centered backdrop={'static'} show={registerPhase === registrationPhases.requestingCredentials}>
        <Modal.Header>
          <Modal.Title>Please enter a secure password.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            size={'sm'}
            type={'password'}
            placeholder={'Password'}
            value={registerValue}
            onChange={evt => dispatchUpdateRegisterPassword(evt.target.value)}
          />
          <div className={'p-2'} />
          <Form.Control
            size={'sm'}
            type={'password'}
            placeholder={'Re-enter Password'}
            value={valueConfirmation}
            onChange={evt => dispatchUpdateRegisterPasswordConfirmation(evt.target.value)}
          />
          {
            registerError && <div className={'pt-4'}><Alert variant={'danger'}>{registerError}</Alert></div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button disabled={!isValidRegisterPassword} variant={'primary'} onClick={() => dispatchSubmitRegisterPassword()}>Register</Button>
        </Modal.Footer>
      </Modal>
      <Modal centered backdrop={'static'} show={loginPhase === loginPhases.decrypting || registerPhase === registrationPhases.registering}>
        <Modal.Body>
          <Container>
            <Row>
              <Col>
                {
                  loginPhase === loginPhase.decrypting
                    ? (<p className={'text-center lead'}>Decrypting...</p>)
                    : (<p className={'text-center lead'}>Generating Keys...</p>)
                }
              </Col>
            </Row>
            <Row>
              <Col></Col>
              <Col md={'auto'}>
                <img src={'./infinity.gif'} />
              </Col>
              <Col></Col>
            </Row>
          </Container>
        </Modal.Body>
      </Modal>
      <Navbar bg={'light'} expand={'lg'}>
        <Navbar.Brand>
          <img
            alt={'Logo'}
            width={'44'}
            style={{ marginRight: '20px '}}
            src={'/logo.png'}
          />
          Nk Notes
        </Navbar.Brand>
        <Navbar.Toggle aria-controls={'basic-navbar-nav'} />
        <Navbar.Collapse id={'basic-navbar-nav'} className={'justify-content-end'}>
          { renderPhase() }
        </Navbar.Collapse>
      </Navbar>
    </div>
  )
};

export default connect(
  state => ({
    login: getLogin(state),
    register: getRegister(state),
    context: getContext(state),
    isLoggedIn: getIsLoggedIn(state),
  }),
  dispatch => ({
    dispatchLoginInit: () => dispatch(initLogin()),
    dispatchUpdateLoginPassword: value => dispatch(updatePasswordLogin(value)),
    dispatchSubmitLoginPassword: () => dispatch(submitPasswordLogin()),
    dispatchRegisterInit: () => dispatch(initRegister()),
    dispatchUpdateRegisterPassword: value => dispatch(updatePasswordRegister(value)),
    dispatchUpdateRegisterPasswordConfirmation: value => dispatch(updatePasswordConfirmationRegister(value)),
    dispatchSubmitRegisterPassword: () => dispatch(submitPasswordRegister()),
  }))(ProfileView);
