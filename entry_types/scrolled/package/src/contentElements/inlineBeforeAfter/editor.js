import {editor} from 'pageflow-scrolled/editor';
import {ColorInputView, FileInputView} from 'pageflow/editor';
import {CheckBoxInputView, TextInputView} from 'pageflow/ui';

editor.contentElementTypes.register('inlineBeforeAfter', {
  configurationEditor() {
    this.tab('general', function() {
      this.input('before_id', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'contentElementConfiguration',
      });
      this.input('before_alt_text', TextInputView);
      this.input('before_label', TextInputView);
      this.input('after_id', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'contentElementConfiguration',
      });
      this.input('after_alt_text', TextInputView);
      this.input('after_label', TextInputView);
      this.input('vertical', CheckBoxInputView);
      this.input('slider', CheckBoxInputView);
      this.input('slider_handle', CheckBoxInputView, {
        visibleBinding: 'slider',
      });
      this.input('slider_color', ColorInputView, {
        visibleBinding: 'slider',
      });
    });
  }
});
