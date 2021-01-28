import { useState } from 'react';
import { Button, Nav, Navbar, Spinner } from 'react-bootstrap';
import { isLoggedIn } from './nk-js';

const ProfileView = ({ context, onCreateUser, onLogin, onLogout }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
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
        {
          isLoggedIn(context)
            ? (
              <Nav>
                <Navbar.Text>Signed in.&nbsp;&nbsp;</Navbar.Text>
                <Button
                  variant={'outline-secondary'}
                  onClick={() => onLogout()}
                >Logout</Button>
              </Nav>
            )
            : (
              <Nav>
                <Button
                  className={'mr-sm-2'}
                  onClick={async () => {
                    setIsRegistering(true);
                    await onCreateUser();
                    setIsRegistering(false);
                  }}
                >
                  {
                    isRegistering
                      ? <Spinner
                        as={'span'}
                        animation={'border'}
                        size={'sm'}
                        role={'status'}
                        aria-hidden={'true'}
                      />
                      : <span>Register</span>
                  }
                </Button>
                <Button
                  variant={'outline'}
                  onClick={() => {
                    if (!isRegistering) {
                      onLogin();
                    }
                  }}
                >Login</Button>
              </Nav>
            )
        }
      </Navbar.Collapse>
    </Navbar>
  )
};

export default ProfileView;
