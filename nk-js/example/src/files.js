import { Button, Col, Container, FormControl, InputGroup, ListGroup, Row, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faLock, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { noteStatus } from './slices/nkSlice';
import { connect } from 'react-redux';
import { getQuery, updateQuery } from './slices/filesSlice';

const FileBrowser = ({  files = [], activeNote, query, dispatchUpdateQuery, onCreateNote, onNoteSelected, }) => {
  // state
  const [isCreating, setIsCreating] = useState(false);

  // generate list items
  const listItems = [(
    <ListGroup.Item key={'__new__'}>
      <Button
        variant={'outline-success'}
        onClick={async () => {
          setIsCreating(true);
          await onCreateNote();
          setIsCreating(false);
        }}
      >
        {
          isCreating
            ? <Spinner
                as={'span'}
                animation={'border'}
                size={'sm'}
                role={'status'}
                aria-hidden={'true'}
              />
            : <span>+ New Note</span>
        }
      </Button>
    </ListGroup.Item>
  )];

  for (let i = 0, len = files.length; i < len; i++) {
    const { key, name, lastUpdatedAt, status } = files[i];
    const lastUpdateTime = new Date();
    lastUpdateTime.setTime(lastUpdatedAt);

    let content;
    switch (status) {
      case noteStatus.error: {
        content = <FontAwesomeIcon icon={faExclamationTriangle}/>;
        break;
      }
      case noteStatus.loading: {
        content = <Spinner animation={'border'} size={'sm'} as={'span'}/>;
        break;
      }
      case noteStatus.unloaded: {
        content = <FontAwesomeIcon icon={faLock}/>;
        break;
      }
      default: {
        content = (
          <Container>
            <Row xs={1} md={1} lg={2} xl={2}>
              <Col>
                <span>{name}</span>
              </Col>
              <Col>
                <span><small>{lastUpdateTime.toLocaleDateString()}</small></span>
              </Col>
            </Row>
          </Container>
        );

        break;
      }
    }

    listItems.push(
      <ListGroup.Item
        action
        key={i}
        active={activeNote === key}
        onClick={() => onNoteSelected(key)}
      >
        { content }
      </ListGroup.Item>
    );
  }

  return (
    <div>
      <div className={'pb-4'}>
        <InputGroup>
          <FormControl type={'text'} placeholder={'Search'} size={'lg'} value={query} onChange={evt => dispatchUpdateQuery(evt.target.value)} />
          <InputGroup.Append>
            <Button variant={'outline-secondary'} onClick={() => dispatchUpdateQuery('')}>
              <FontAwesomeIcon icon={faTimesCircle} />
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </div>

      <ListGroup>
        {listItems}
      </ListGroup>
    </div>
  );
};

export default connect(
  state => ({
    query: getQuery(state),
  }),
  dispatch => ({
    dispatchUpdateQuery: query => dispatch(updateQuery(query)),
  }),
)(FileBrowser);
