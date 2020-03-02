import {editor} from 'pageflow-scrolled/editor';
import {ColorInputView, FileInputView} from 'pageflow/editor';
import {CheckBoxInputView, TextInputView} from 'pageflow/ui';

editor.contentElementTypes.register('inlineBeforeAfter', {
  configurationEditor() {
    this.tab('general', function() {
      this.input('left_id', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'contentElementConfiguration',
      });
      this.input('left_alt_text', TextInputView);
      this.input('left_label', TextInputView);
      this.input('right_id', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'contentElementConfiguration',
      });
      this.input('right_alt_text', TextInputView);
      this.input('right_label', TextInputView);
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
