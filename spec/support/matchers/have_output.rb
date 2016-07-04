RSpec::Matchers.define :have_output do
  chain :to_s3 do |path|
    @s3_url = path.prepend('s3://com-example-pageflow-out')
  end
  match do |definition|
    definition.outputs.detect { |output| output[:url] == @s3_url }.try(:any?)
  end
  failure_message do |definition|
    "expected to find URL #{@s3_url} in output URLs #{definition.outputs.map{ |output| output[:url] }}"
  end
  failure_message_when_negated do |definition|
    "expected to not find URL #{@s3_url} in output URLs, but found it"
  end
end
