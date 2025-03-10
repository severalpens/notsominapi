# Code Citations

## License: MIT
https://github.com/Uvacoder/what-if-grid/tree/5ecb22fa006fad29abafe356bc95e1a929069d97/notes/snippets/2020-10-07-github-actions.md

```
with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
```

