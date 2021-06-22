import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Modal, Spinner} from 'react-bootstrap';
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
  dispatchNewDraftInternal, dispatchUpdateTitle, dispatchUpdateBody }) => {

  const { title, body, lastUpdatedAt, } = drafts[key] || {};
  const onSave = async () => await _onSave({ key, title, body });
  const onDuplicate = async () => await _onDuplicate(key);
  const onNew = async () => await _onNew();
  const onDelete = async () => await _onDelete(key);

  const ref = useRef(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isMetaDown, setIsMetaDown] = useState(false);
  const [isCtrlDown, setIsCtrlDown] = useState(false);

  const map = [
    { key: 's', action: onSave },
    { key: 'd', action: onDuplicate },
    { key: 'n', action: onNew },
    { key: 'Delete', action: () => setShowDelete(true) },
    { key: 'Backspace', action: () => setShowDelete(true) },
  ];

  // from map
  const hotkeyComponents = map.map((hotkey, i) => <Hotkey hotkey={hotkey} key={i} />);

  useEffect(() => {
    if (newDraft) {
      if (ref.current) {
        ref.current.getInstance().setMarkdown(body);
        ref.current.getInstance().focus();
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

      <div className={'pb-4'}>
        <Form.Control
          size={'lg'}
          type={'text'}
          placeholder={'Title'}
          value={title}
          onChange={evt => dispatchUpdateTitle(evt.target.value)}
        />
      </div>

      <div className={'pb-4'}>
        <ButtonToolbar className={'justify-content-between'}>
          <ButtonGroup>
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
          <p className={'mb-0 mt-2'}><small>Last saved {lastUpdateTime.toLocaleString('en-US')}</small></p>
          <ButtonGroup>
            <Button
              variant={'outline-danger'}
              onClick={() => setShowDelete(true)}
            ><FontAwesomeIcon icon={faTrash} /></Button>
          </ButtonGroup>
        </ButtonToolbar>
      </div>

      <Editor
        ref={ref}
        initialValue={body}
        placeholder='Start writing'
        previewStyle='vertical'
        height='600px'
        initialEditType='wysiwyg'
        useCommandShortcut={false}
        usageStatistics={false}
        onChange={() => {
          const contents = ref.current.getInstance().getMarkdown();
          if (body === contents) {
            return;
          }

          dispatchUpdateBody(contents);
        }}
        onKeydown={async (evt) => {
          const eventKey = evt.data.key;
          if (eventKey === 'Meta') {
            setIsMetaDown(true);
          } else if (eventKey === 'Control') {
            setIsCtrlDown(true);
          } else if (isMetaDown || isCtrlDown) {
            for (const hotkey of map) {
              if (hotkey.key === eventKey) {
                evt.data.preventDefault();

                await hotkey.action();
              }
            }
          }
        }}
        onKeyup={evt => {
          if (evt.data.key === 'Meta') {
            setIsMetaDown(false);
          } else if (evt.data.key === 'Control') {
            setIsCtrlDown(false);
          }
        }}
      />
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
  }),
)(NoteEditor);
