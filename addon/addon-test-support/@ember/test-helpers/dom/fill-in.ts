import getElement from './-get-element';
import isFormControl, { FormControl } from './-is-form-control';
import guardForMaxlength from './-guard-for-maxlength';
import { __focus__ } from './focus';
import settled from '../settled';
import fireEvent from './fire-event';
import Target, { isContentEditable } from './-target';
import { log } from './-logging';
import { runHooks, registerHook } from '../helper-hooks';
import getDescription from './-get-description';

registerHook('fillIn', 'start', (target: Target, text: string) => {
  log('fillIn', target, text);
});

/**
  Fill the provided text into the `value` property (or set `.innerHTML` when
  the target is a content editable element) then trigger `change` and `input`
  events on the specified target.

  @public
  @param {string|Element|IDOMElementDescriptor} target the element, selector, or descriptor to enter text into
  @param {string} text the text to fill into the target element
  @return {Promise<void>} resolves when the application is settled

  @example
  <caption>
    Emulating filling an input with text using `fillIn`
  </caption>

  fillIn('input', 'hello world');
*/
export default function fillIn(target: Target, text: string): Promise<void> {
  return Promise.resolve()
    .then(() => runHooks('fillIn', 'start', target, text))
    .then(() => {
      if (!target) {
        throw new Error(
          'Must pass an element, selector, or descriptor to `fillIn`.'
        );
      }

      let element = getElement(target) as Element | HTMLElement;
      if (!element) {
        let description = getDescription(target);
        throw new Error(
          `Element not found when calling \`fillIn('${description}')\`.`
        );
      }

      if (typeof text === 'undefined' || text === null) {
        throw new Error('Must provide `text` when calling `fillIn`.');
      }

      if (isFormControl(element)) {
        if (element.disabled) {
          throw new Error(
            `Can not \`fillIn\` disabled '${getDescription(target)}'.`
          );
        }

        if ('readOnly' in element && element.readOnly) {
          throw new Error(
            `Can not \`fillIn\` readonly '${getDescription(target)}'.`
          );
        }

        guardForMaxlength(element, text, 'fillIn');

        return __focus__(element).then(() => {
          (element as FormControl).value = text;
          return element;
        });
      } else if (isContentEditable(element)) {
        return __focus__(element).then(() => {
          element.innerHTML = text;
          return element as Element;
        });
      } else {
        throw new Error(
          '`fillIn` is only usable on form controls or contenteditable elements.'
        );
      }
    })
    .then((element) =>
      fireEvent(element, 'input')
        .then(() => fireEvent(element, 'change'))
        .then(settled)
    )
    .then(() => runHooks('fillIn', 'end', target, text));
}
