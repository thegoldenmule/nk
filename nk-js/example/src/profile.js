import { Button, Form, Modal, Nav, Navbar, Spinner } from 'react-bootstrap';
import { connect } from 'react-redux';
import { getContext, logout, signUp } from './slices/nkSlice';
import { getLogin, init, loginPhases, submitPassword, updatePassword } from './slices/loginSlice';
import { useEffect, useRef } from 'react';

const ProfileView = ({ login, context, onCreateUser, dispatchLoginInit, dispatchUpdatePassword, dispatchSubmitPassword, dispatchLogout, dispatchSignup }) => {

  const { phase, value, error, contextData, context: loginContext } = login;

  const renderPhase = () => {
    switch (phase) {
      case loginPhases.completeAnonymous:
      case loginPhases.uninitialized: {
        return (
          <Nav>
            <Button
              className={'mr-sm-2'}
              onClick={() => dispatchSignup()}
            >
            </Button>
            <Button
              variant={'outline'}
              onClick={() => dispatchLoginInit()}
            >Login</Button>
          </Nav>
        );
      }
      case loginPhases.requestingCredentials: {
        return (
          <></>
        );
      }
      case loginPhases.decrypting: {
        return (
          <Nav>
            <Spinner animation={'border'} size={'sm'} role={'status'} />
          </Nav>
        );
      }
      case loginPhases.completeLoggedIn: {
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
    }
  }

  useEffect(() => dispatchLoginInit(), []);
  const passwordRef = useRef(null);
  useEffect(() => passwordRef.current && passwordRef.current.focus());

  return (
    <div>
      <Modal show={phase === loginPhases.requestingCredentials}>
        <Modal.Header>
          <Modal.Title>Please enter your password.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            ref={passwordRef}
            size={'sm'}
            type={'password'}
            placeholder={'Password'}
            value={value}
            onChange={evt => dispatchUpdatePassword(evt.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant={'secondary'} onClick={() => dispatchLogout()}>Cancel</Button>
          <Button variant={'primary'} onClick={() => dispatchSubmitPassword()}>Login</Button>
        </Modal.Footer>
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
    context: getContext(state),
  }),
  dispatch => ({
    dispatchLoginInit: () => dispatch(init()),
    dispatchUpdatePassword: value => dispatch(updatePassword(value)),
    dispatchSubmitPassword: () => dispatch(submitPassword()),
    dispatchLogout: () => dispatch(logout()),
    dispatchSignUp: () => dispatch(signUp()),
  }))(ProfileView);
