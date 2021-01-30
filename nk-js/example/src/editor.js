import { useRef, useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faHistory, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@toast-ui/react-editor';
import * as PropTypes from 'prop-types';
import { noteFromParametersFactory } from './notes';

const NoteEditor = ({ activeNote, note = {}, onSave }) => {
  const { title, body } = note;

  const ref = useRef(null);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftBody, setDraftBody] = useState(body);
  const [isSaving, setIsSaving] = useState(false);

  if (!activeNote) {
    return null;
  }

  return (
    <div>
      <div className={'pb-4'}>
        <Form.Control
          size={'lg'}
          type={'text'}
          placeholder={'Title'}
          value={draftTitle}
          onChange={evt => setDraftTitle(evt.target.value)}
        />
      </div>

      <div className={'pb-4'}>
        <ButtonToolbar className={'justify-content-between'}>
          <ButtonGroup>
            <Button
              onClick={async () => {
                setIsSaving(true);
                await onSave({
                  key: activeNote,
                  note: noteFromParametersFactory({title: draftTitle, body: draftBody}),
                });
                setIsSaving(false);
              }}
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
            <Button variant={'outline-secondary'}><FontAwesomeIcon icon={faCopy} /></Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant={'outline-secondary'}><FontAwesomeIcon icon={faHistory} /></Button>
            <Button variant={'outline-danger'}><FontAwesomeIcon icon={faTrash} /></Button>
          </ButtonGroup>
        </ButtonToolbar>
      </div>

      <Editor
        ref={ref}
        initialValue={draftBody}
        placeholder='Start writing'
        previewStyle='vertical'
        height='600px'
        initialEditType='wysiwyg'
        useCommandShortcut={true}
        onChange={() => setDraftBody(ref.current.getInstance().getMarkdown())}
      />
    </div>
  )
};

NoteEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  note: PropTypes.object,
  activeNote: PropTypes.string
};

export default NoteEditor;
