import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@toast-ui/react-editor';
import { connect } from 'react-redux';
import {
  getDraft,
  newDraftUpdatedInternal,
  updateBody,
  updateTitle
} from './slices/draftSlice';
import { getNoteStatuses, noteStatus } from './slices/nkSlice';
import { getActiveKey } from './slices/workspaceSlice';
import { useHotkeys } from 'react-hotkeys-hook';
import { focusSearch } from './slices/filesSlice';
import { blurOnEscape } from './utility';

// Logical component for hotkeys.
const Hotkey = ({ hotkey: { key, action } }) => {
  useHotkeys(`command+${key}, ctrl+${key}`, event => {
    event.preventDefault();

    action();
  }, {}, [key, action]);

  return null;
}

const NoteEditor = ({
  onSave: _onSave, onDuplicate: _onDuplicate, onNew: _onNew, onDelete: _onDelete,
  isSaving,
  draft: { key, drafts, newDraft },
  dispatchNewDraftInternal, dispatchUpdateTitle, dispatchUpdateBody, dispatchSearchFocus, }) => {

  const { title, body, lastUpdatedAt, } = drafts[key] || {};
  const onSave = async () => await _onSave({ key, title, body });
  const onDuplicate = async () => await _onDuplicate(key);
  const onNew = async () => await _onNew();
  const onDelete = async () => await _onDelete(key);

  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const [showDelete, setShowDelete] = useState(false);

  const map = [
    { key: 's', action: onSave },
    { key: 'd', action: onDuplicate },
    { key: 'n', action: onNew },
    { key: 'f', action: dispatchSearchFocus },
    { key: 'e', action: () => editorRef.current.getInstance().focus() },
    { key: 'h', action: () => titleRef.current.focus() },
    { key: 'm', action: () => {
      if (editorRef.current) {
        if (editorRef.current.getInstance().isMarkdownMode()) {
          editorRef.current.getInstance().changeMode('wysiwyg');
        } else {
          editorRef.current.getInstance().changeMode('markdown');
        }
      }
    }},
    { key: 'Delete', action: () => setShowDelete(true) },
    { key: 'Backspace', action: () => setShowDelete(true) },
  ];

  // from map
  const hotkeyComponents = map.map((hotkey, i) =>
    <Hotkey hotkey={hotkey} key={i} />);

  useEffect(() => {
    if (newDraft) {
      if (editorRef.current) {
        editorRef.current.getInstance().setMarkdown(body);
        editorRef.current.getInstance().focus();
      }

      dispatchNewDraftInternal();
    }
  });

  if (!key) {
    return null;
  }

  const lastUpdateTime = new Date();
  lastUpdateTime.setTime(lastUpdatedAt);

  return (
    <div>
      {hotkeyComponents}

      {/* Delete modal. */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <p>{`Are you sure you want to permanently delete '${title}'? There will be no way to recover this note.`}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={'secondary'} onClick={() => setShowDelete(false)}>Close</Button>
          <Button variant={'danger'} onClick={async () => {
            await onDelete();

            setShowDelete(false);
          }}>Delete</Button>
        </Modal.Footer>
      </Modal>

      <Container className={'p-0'}>
        {/* Note title */}
        <Row>
          <Col>
            <Form.Control
              ref={titleRef}
              size={'lg'}
              type={'text'}
              placeholder={'Title'}
              value={title}
              onChange={evt => dispatchUpdateTitle(evt.target.value)}
              onKeyDown={blurOnEscape}
            />
          </Col>
        </Row>

        {/* Note toolbar */}
        <Row className={'pb-4 pt-4'} noGutters>
          <Col>
            <ButtonGroup className={'mr-2'}>
              <Button
                onClick={onSave}
              >
                {
                  isSaving
                    ? <Spinner
                      as={'span'}
                      animation={'border'}
                      size={'sm'}
                      role={'status'}
                      aria-hidden={'true'}
                    />
                    : <FontAwesomeIcon icon={faSave} />
                }
              </Button>
              <Button variant={'outline-secondary'} onClick={onDuplicate}>
                <FontAwesomeIcon icon={faCopy} />
              </Button>
            </ButtonGroup>
            <ButtonGroup className={'mr-2'}>
              <Button
                variant={'outline-danger'}
                onClick={() => setShowDelete(true)}
              ><FontAwesomeIcon icon={faTrash} /></Button>
            </ButtonGroup>
          </Col>
          <Col>
            <p className={'mt-2 mb-n2 text-right'}><small>{lastUpdateTime.toLocaleString('en-US')}</small></p>
          </Col>
        </Row>

        {/* Note text editor */}
        <Row>
          <Col>
            <Editor
              ref={editorRef}
              initialValue={body}
              placeholder='Start writing'
              previewStyle='vertical'
              height='600px'
              initialEditType='wysiwyg'
              useCommandShortcut={false}
              usageStatistics={false}
              onChange={() => {
                const contents = editorRef.current.getInstance().getMarkdown();
                if (body === contents) {
                  return;
                }

                dispatchUpdateBody(contents);
              }}
              onKeydown={async (evt) => {
                const eventKey = evt.data.key;

                if ((evt.data.metaKey && !evt.data.ctrlKey)
                  || (evt.data.ctrlKey && !evt.data.metaKey)) {
                  for (const hotkey of map) {
                    if (hotkey.key === eventKey) {
                      evt.data.preventDefault();

                      await hotkey.action();
                    }
                  }
                } else if (eventKey === 'Escape') {
                  editorRef.current.getInstance().blur();
                }
              }}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default connect(
  state => ({
    draft: getDraft(state),
    isSaving: getNoteStatuses(state)[getActiveKey(state)] === noteStatus.saving,
  }),
  dispatch => ({
    dispatchUpdateTitle: title => dispatch(updateTitle(title)),
    dispatchUpdateBody: body => dispatch(updateBody(body)),
    dispatchNewDraftInternal: () => dispatch(newDraftUpdatedInternal()),
    dispatchSearchFocus: () => dispatch(focusSearch()),
  }),
)(NoteEditor);
