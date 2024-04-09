import { CopyIcon } from "@radix-ui/react-icons"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { toast } from "./ui/use-toast"


export function Share({idString}: {idString: string}) {
  const defaultValue = `https://branded.ai/${idString}`

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultValue)
      .then(() => {
        toast({
          description: "Copied to clipboard"
        })
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          description: "Unable to copy to clipboard"
        })
        console.error('Unable to copy text: ', err);
      });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="w-full" variant="ghost">Share</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[350px]">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h3 className="text-lg font-semibold">Share Name</h3>
          <p className="text-sm text-muted-foreground">
            Share these names with your friends and teammates
          </p>
        </div>
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={defaultValue}
              readOnly
              className="h-9"
            />
          </div>
          <Button type="submit" size="sm" onClick={handleCopy} className="px-3">
            <span className="sr-only">Copy</span>
            <CopyIcon className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}