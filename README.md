# `depot/pull-action`

This action pulls images from the Depot ephemeral registry. It's intended to be used with `save: true` in the [depot/build-push-action](https://github.com/depot/build-push-action).

## Usage

Download and use the latest version of the CLI:

```yaml
jobs:
  job-name:
    steps:
      - uses: depot/setup-action@v1
      - uses: depot/build-push-action@v1
        id: build
        with:
          save: true
      - uses: depot/pull-action@v1
        with:
          build-id: ${{ steps.build.outputs.build-id }}
          tags: |
            org/repo:tag
```

## Inputs

| Name       | Type     | Required | Description                                                                                                |
| ---------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `build-id` | string   | **yes**  | The build ID to pull images for.                                                                           |
| `platform` | string   | no       | The image platform to pull (defaults to the current platform).                                             |
| `tags`     | list/CSV | no       | A list of tags to apply to the pulled image.                                                               |
| `target`   | string   | no       | For a bake build specifies the specific target to pull.                                                    |
| `token`    | string   | no       | The API token to use for authentication. This can be overridden by the `DEPOT_TOKEN` environment variable. |

## License

MIT License, see `LICENSE`.
