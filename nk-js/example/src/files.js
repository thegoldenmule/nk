import { Button, Col, Container, FormControl, InputGroup, ListGroup, Row, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faLock, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { getNoteValues, loadNote, newNote, noteStatus } from './slices/nkSlice';
import { connect } from 'react-redux';
import { getQuery, getSearchFocus, updateQuery } from './slices/filesSlice';
import { blurOnEscape } from './utility';
import { unwrapResult } from '@reduxjs/toolkit';
import { updateActiveKey } from './slices/workspaceSlice';
import { newDraft } from './slices/draftSlice';

const FileBrowser = ({
  files = [],
  activeNote, query, searchFocus, noteValues,
  dispatchUpdateQuery, dispatchNewNote, dispatchUpdateActiveKey, dispatchLoadNote }) => {

  // hooks
  const [isCreating, setIsCreating] = useState(false);
  const searchRef = useRef(null);
  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchFocus]);

  // handler to create a new note
  const onCreateNote = async from => {
    // create note
    const res = await dispatchNewNote({ from });
    let payload;
    try {
      payload = await unwrapResult(res);
    } catch (error) {
      return;
    }

    // select note
    const { key, note } = payload;
    dispatchUpdateActiveKey({ key, note });
  };

  // called to select note
  const onNoteSelected = async key => {
    let note = noteValues[key];
    if (!note) {
      let res = await dispatchLoadNote({ key });

      try {
        res = unwrapResult(res);
        note = res.note;
      } catch (error) {
        // if load note doesn't work, do not update active key
        return;
      }
    }

    dispatchUpdateActiveKey({ key, note });
  };

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
          <FormControl
            ref={searchRef}
            type={'text'}
            placeholder={'Search'}
            size={'lg'}
            value={query}
            onChange={evt => dispatchUpdateQuery({ query: evt.target.value })}
            onKeyDown={blurOnEscape}
          />
          <InputGroup.Append>
            <Button variant={'outline-secondary'} onClick={() => dispatchUpdateQuery({ query: '' })}>
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
    searchFocus: getSearchFocus(state),
    noteValues: getNoteValues(state),
  }),
  dispatch => ({
    // search bar
    dispatchUpdateQuery: ({ query }) => dispatch(updateQuery(query)),

    // new note
    dispatchNewNote: ({ from }) => dispatch(newNote({ from })),

    // select note
    dispatchUpdateActiveKey: ({ key, note }) => {
      dispatch(updateActiveKey(key));
      dispatch(newDraft({ key, note }));
    },

    // loads note
    dispatchLoadNote: ({ key }) => dispatch(loadNote(key)),
  }),
)(FileBrowser);
